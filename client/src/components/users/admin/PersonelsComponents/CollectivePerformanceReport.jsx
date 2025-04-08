import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: '1px solid #ccc',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 100,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  reportInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    minHeight: 30,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowHeader: {
    backgroundColor: '#e5e7eb',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
  },
  tableColLeft: {
    flex: 1,
    padding: 5,
    textAlign: 'left',
  },
  tableColRight: {
    flex: 1,
    padding: 5,
    textAlign: 'right',
  },
  smallText: {
    fontSize: 9,
    color: '#666',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  statTitle: {
    fontSize: 10,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statSubtitle: {
    fontSize: 8,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderTopStyle: 'solid',
    paddingTop: 5,
  },
  summary: {
    marginBottom: 15,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  highlightBox: {
    backgroundColor: '#e5edff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  highlightValue: {
    fontSize: 10,
    color: '#4b5563',
  },
});

const CollectivePerformanceReport = ({ data }) => {
  // Format today's date
  const formattedDate = format(new Date(), "MMMM dd, yyyy");
  
  // Format period dates with error handling
  let startDateFormatted = "Unknown";
  let endDateFormatted = "Unknown";
  
  try {
    if (data.periodStart) {
      startDateFormatted = format(new Date(data.periodStart), "MMMM dd, yyyy");
    }
    if (data.periodEnd) {
      endDateFormatted = format(new Date(data.periodEnd), "MMMM dd, yyyy");
    }
  } catch (error) {
    console.error("Error formatting dates:", error);
  }

  // Add default values for potentially missing data
  const safeData = {
    title: data.title || "Performance Report",
    totalTanods: data.totalTanods || 0,
    reportType: (data.reportType || "monthly").charAt(0).toUpperCase() + (data.reportType || "monthly").slice(1),
    aggregates: {
      patrols: {
        total: getValueOrDefault(data.aggregates?.patrols?.total, 0),
        completed: getValueOrDefault(data.aggregates?.patrols?.completed, 0),
        average: getValueOrDefault(data.aggregates?.patrols?.average, 0)
      },
      attendance: {
        average: getValueOrDefault(data.aggregates?.attendance?.average, 0),
        onTimeAverage: getValueOrDefault(data.aggregates?.attendance?.onTimeAverage, 0),
        totalAbsences: getValueOrDefault(data.aggregates?.attendance?.totalAbsences, 0)
      },
      incidents: {
        total: getValueOrDefault(data.aggregates?.incidents?.total, 0),
        resolved: getValueOrDefault(data.aggregates?.incidents?.resolved, 0),
        responseRateAverage: getValueOrDefault(data.aggregates?.incidents?.responseRateAverage, 0)
      },
      ratings: {
        average: getValueOrDefault(data.aggregates?.ratings?.average, 0),
        totalRatings: getValueOrDefault(data.aggregates?.ratings?.totalRatings, 0)
      }
    },
    tanodData: Array.isArray(data.tanodData) ? data.tanodData : []
  };
  
  // Helper function to safely get values with defaults
  function getValueOrDefault(value, defaultValue) {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return defaultValue;
    }
    return value;
  }
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Tanod Collective Performance Report</Text>
            <Text style={styles.subtitle}>{safeData.title}</Text>
            <Text style={styles.reportInfo}>Generated on: {formattedDate}</Text>
            <Text style={styles.reportInfo}>Period: {startDateFormatted} to {endDateFormatted}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* If there's a logo, uncomment this */}
            {/* <Image style={styles.logo} src="/path-to-logo.png" /> */}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Performance Summary</Text>
          <Text style={styles.summaryText}>Total Tanods: {safeData.totalTanods}</Text>
          <Text style={styles.summaryText}>Report Type: {safeData.reportType}</Text>
          <Text style={styles.summaryText}>Performance Period: {startDateFormatted} to {endDateFormatted}</Text>
        </View>

        {/* Key Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Patrols</Text>
              <Text style={styles.statValue}>{safeData.aggregates.patrols.total}</Text>
              <Text style={styles.statSubtitle}>All tanods combined</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Completed Patrols</Text>
              <Text style={styles.statValue}>{safeData.aggregates.patrols.completed}</Text>
              <Text style={styles.statSubtitle}>Successfully completed</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Avg. Patrols</Text>
              <Text style={styles.statValue}>{safeData.aggregates.patrols.average}</Text>
              <Text style={styles.statSubtitle}>Per tanod</Text>
            </View>
          </View>
        </View>

        {/* Attendance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Avg. Attendance Rate</Text>
              <Text style={styles.statValue}>{safeData.aggregates.attendance.average}%</Text>
              <Text style={styles.statSubtitle}>Across all tanods</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>On-Time Rate</Text>
              <Text style={styles.statValue}>{safeData.aggregates.attendance.onTimeAverage}%</Text>
              <Text style={styles.statSubtitle}>Average punctuality</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Absences</Text>
              <Text style={styles.statValue}>{safeData.aggregates.attendance.totalAbsences}</Text>
              <Text style={styles.statSubtitle}>Missed schedules</Text>
            </View>
          </View>
        </View>

        {/* Incident Response */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Response</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Incidents</Text>
              <Text style={styles.statValue}>{safeData.aggregates.incidents.total}</Text>
              <Text style={styles.statSubtitle}>Incidents responded to</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Resolved Incidents</Text>
              <Text style={styles.statValue}>{safeData.aggregates.incidents.resolved}</Text>
              <Text style={styles.statSubtitle}>Successfully resolved</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Avg. Response Rate</Text>
              <Text style={styles.statValue}>{safeData.aggregates.incidents.responseRateAverage}%</Text>
              <Text style={styles.statSubtitle}>Resolution success</Text>
            </View>
          </View>
        </View>

        {/* Community Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Feedback Overview</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Average Rating</Text>
              <Text style={styles.statValue}>{safeData.aggregates.ratings.average}</Text>
              <Text style={styles.statSubtitle}>Across all tanods</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Ratings</Text>
              <Text style={styles.statValue}>{safeData.aggregates.ratings.totalRatings}</Text>
              <Text style={styles.statSubtitle}>All feedback received</Text>
            </View>
          </View>
        </View>

        {/* Top Performers Table */}
        {safeData.tanodData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tanod Performance Rankings</Text>
            
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={{ flex: 0.5 }}><Text>Rank</Text></View>
                <View style={styles.tableColLeft}><Text>Name</Text></View>
                <View style={styles.tableCol}><Text>Patrols</Text></View>
                <View style={styles.tableCol}><Text>Attendance %</Text></View>
                <View style={styles.tableCol}><Text>Incidents</Text></View>
                <View style={styles.tableCol}><Text>Rating</Text></View>
              </View>
              
              {safeData.tanodData
                .filter(td => td && td.tanod) // Ensure we have valid data
                .sort((a, b) => {
                  // Safe sorting function with error handling
                  try {
                    return (
                      ((parseFloat(b.attendanceStats?.attendanceRate || 0) * 0.3) + 
                      (parseFloat(b.ratingsData?.overallRating || 0) * 0.7)) - 
                      ((parseFloat(a.attendanceStats?.attendanceRate || 0) * 0.3) + 
                      (parseFloat(a.ratingsData?.overallRating || 0) * 0.7))
                    );
                  } catch (error) {
                    return 0;
                  }
                })
                .slice(0, 10) // Top 10 performers
                .map((tanodData, index) => (
                  <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                    <View style={{ flex: 0.5, padding: 5 }}><Text>{index + 1}</Text></View>
                    <View style={styles.tableColLeft}>
                      <Text>{tanodData.tanod.firstName || ''} {tanodData.tanod.lastName || ''}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{tanodData.patrolStats?.totalPatrols || 0}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{tanodData.attendanceStats?.attendanceRate || 0}%</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{tanodData.incidentStats?.totalIncidentResponses || 0}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{tanodData.ratingsData?.overallRating || '0.0'}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Areas for Improvement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas for Improvement</Text>
          
          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Attendance Issues</Text>
            <Text style={styles.highlightValue}>
              {safeData.aggregates.attendance.average < 80 ? (
                `The overall attendance rate of ${safeData.aggregates.attendance.average}% is below the target of 80%. Focus should be placed on improving tanod attendance.`
              ) : (
                `The overall attendance rate of ${safeData.aggregates.attendance.average}% is good. Continue to maintain high attendance standards.`
              )}
            </Text>
          </View>
          
          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Incident Response Effectiveness</Text>
            <Text style={styles.highlightValue}>
              {safeData.aggregates.incidents.responseRateAverage < 75 ? (
                `The incident response rate of ${safeData.aggregates.incidents.responseRateAverage}% needs improvement. Additional training may be beneficial.`
              ) : (
                `The incident response rate of ${safeData.aggregates.incidents.responseRateAverage}% shows effective handling of situations.`
              )}
            </Text>
          </View>
          
          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Community Perception</Text>
            <Text style={styles.highlightValue}>
              {parseFloat(safeData.aggregates.ratings.average) < 4.0 ? (
                `The average community rating of ${safeData.aggregates.ratings.average} indicates room for improvement in community relations.`
              ) : (
                `The average community rating of ${safeData.aggregates.ratings.average} shows positive community perception of tanod services.`
              )}
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Tanod Collective Performance Report | {safeData.title} | Generated on {formattedDate}</Text>
          <Text>This report is confidential and intended for internal use only.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CollectivePerformanceReport;
