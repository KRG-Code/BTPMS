const TanodLocation = require('../models/TanodLocation');
const { getIO } = require('../websocket');

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, currentScheduleId } = req.body;
    const userId = req.user.id;

    // Check for active patrol and get color
    const Schedule = require('../models/Schedule');
    const activeSchedule = await Schedule.findOne({
      'patrolStatus': {
        $elemMatch: {
          tanodId: userId,
          status: 'Started'
        }
      },
      endTime: { $gt: new Date() }
    }).populate('patrolArea');

    // Determine marker color and patrol status
    const markerColor = activeSchedule?.patrolArea?.color || 'red';
    const isOnPatrol = !!activeSchedule;
    
    // Update location with all relevant data
    const location = await TanodLocation.findOneAndUpdate(
      { userId },
      { 
        userId,
        latitude,
        longitude,
        currentScheduleId: activeSchedule?._id || currentScheduleId,
        markerColor,
        isOnPatrol,
        lastUpdate: new Date(),
        isActive: true
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await location.populate({
      path: 'userId',
      select: 'firstName lastName profilePicture'
    });

    // Emit real-time update
    const io = getIO();
    io.to('tracking').emit('locationUpdate', location);

    res.status(200).json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Add a new method to handle patrol end
exports.updatePatrolStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update location marker color back to red when patrol ends
    const location = await TanodLocation.findOneAndUpdate(
      { userId, isActive: true },
      { 
        markerColor: 'red',
        isOnPatrol: false,
        currentScheduleId: null,
        lastUpdate: new Date()
      },
      { new: true }
    );

    if (location) {
      await location.populate({
        path: 'userId',
        select: 'firstName lastName profilePicture'
      });

      // Emit the update through WebSocket
      const io = getIO();
      io.to('tracking').emit('locationUpdate', {
        ...location.toObject(),
        markerColor: 'red',
        isOnPatrol: false
      });
    }

    res.status(200).json({ message: 'Patrol status updated successfully' });
  } catch (error) {
    console.error('Error updating patrol status:', error);
    res.status(500).json({ message: 'Failed to update patrol status' });
  }
};

// Add helper function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

exports.getActiveLocations = async (req, res) => {
  try {
    const locations = await TanodLocation.find({ isActive: true })
      .populate({
        path: 'userId',
        select: 'firstName lastName profilePicture'
      })
      .populate({
        path: 'currentScheduleId',
        populate: {
          path: 'patrolArea',
          select: 'color legend'
        }
      });

    const populatedLocations = await Promise.all(locations.map(async (loc) => {
      if (loc.currentScheduleId?.patrolArea) {
        return {
          ...loc.toObject(),
          patrolArea: loc.currentScheduleId.patrolArea
        };
      }
      return loc.toObject();
    }));

    res.status(200).json(populatedLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

exports.deactivateLocation = async (req, res) => {
  try {
    await TanodLocation.findOneAndUpdate(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );
    res.status(200).json({ message: 'Location tracking deactivated' });
  } catch (error) {
    console.error('Error deactivating location:', error);
    res.status(500).json({ message: 'Failed to deactivate location' });
  }
};
