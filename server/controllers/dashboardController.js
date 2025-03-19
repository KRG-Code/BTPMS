const Schedule = require('../models/Schedule');
const User = require('../models/User');
const IncidentReport = require('../models/IncidentReport');
const TanodLocation = require('../models/TanodLocation');

exports.getDashboardStats = async (req, res) => {
  try {
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate time threshold for "online" status (5 minutes ago)
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);

    // Get online tanods - now using User model and checking both isOnline and lastActive
    const onlineTanods = await User.countDocuments({
      userType: 'tanod',
      isOnline: true,
      lastActive: { $gt: onlineThreshold }
    });

    // Get total tanods
    const totalTanods = await User.countDocuments({ userType: 'tanod' });

    // Get active patrols
    const activePatrols = await Schedule.countDocuments({
      'patrolStatus.status': 'Started',
      endTime: { $gt: new Date() }
    });

    // Get tanods on patrol
    const tanodsOnPatrol = await Schedule.distinct('tanods', {
      'patrolStatus.status': 'Started'
    });

    // Calculate available tanods (exclude those on patrol and offline)
    const availableTanods = onlineTanods - tanodsOnPatrol.length;

    // Get today's schedules 
    const todaySchedules = await Schedule.countDocuments({
      startTime: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Get total patrols completed this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const totalPatrols = await Schedule.countDocuments({
      startTime: { $gte: monthStart, $lte: monthEnd },
      status: 'Completed'
    });

    // Get incidents per type per month
    const incidentStats = await IncidentReport.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing tanods
    const topPerformers = await User.aggregate([
      {
        $match: { userType: 'tanod' }
      },
      {
        $lookup: {
          from: 'tanodratings',
          localField: '_id',
          foreignField: 'tanodId',
          as: 'ratings'
        }
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$ratings.ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            _id: '$_id',
            firstName: '$firstName',
            lastName: '$lastName'
          },
          averageRating: { $avg: '$ratings.ratings.rating' }
        }
      },
      {
        $project: {
          firstName: '$_id.firstName',
          lastName: '$_id.lastName',
          avgRating: { $round: ['$averageRating', 1] }
        }
      },
      {
        $sort: { avgRating: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Format the results
    const formattedTopPerformers = topPerformers.map(t => ({
      name: `${t.firstName} ${t.lastName}`,
      rating: t.avgRating || 0
    }));

    // Get resolved incidents count
    const resolvedIncidents = await IncidentReport.countDocuments({ status: 'Resolved' });

    res.json({
      success: true,
      data: {
        patrolsScheduled: todaySchedules,
        activePatrols,
        totalPatrols,
        incidentsResponded: resolvedIncidents,
        onlineTanods,
        tanodsOnPatrol: tanodsOnPatrol.length,
        totalTanods,
        availableTanods: availableTanods >= 0 ? availableTanods : 0,
        incidentStats,
        topPerformers: formattedTopPerformers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
