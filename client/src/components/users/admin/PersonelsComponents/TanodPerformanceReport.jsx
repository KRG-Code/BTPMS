import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
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
  tanodInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5,
  },
  tanodDetails: {
    flex: 1,
  },
  tanodName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tanodTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  tanodContact: {
    fontSize: 10,
    color: '#666',
  },
  performanceHighlight: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  ratings: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    color: '#fbbf24',
    fontSize: 14,
    marginRight: 2,
  },
  ratingNumber: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

// Helper function to get the star rating display
const renderStarRating = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  const stars = [];
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  
  if (halfStar) {
    stars.push('★');
  }
  
  for (let i = 0; i < emptyStars; i++) {
    stars.push('☆');
  }
  
  return (
    <View style={styles.ratings}>
      <Text style={styles.star}>{stars.join('')}</Text>
      <Text style={styles.ratingNumber}>({rating})</Text>
    </View>
  );
};

const TanodPerformanceReport = ({ tanod, performanceData, reportType = 'monthly', reportPeriod }) => {
  // Format dates
  const formattedDate = format(new Date(), "MMMM dd, yyyy");
  
  // Determine report title based on type
  let reportTitle;
  if (reportType === 'monthly') {
    reportTitle = `Monthly Performance Report - ${reportPeriod.label}`;
  } else if (reportType === 'quarterly') {
    reportTitle = `Quarterly Performance Report - ${reportPeriod.label}`;
  } else {
    reportTitle = `Yearly Performance Report - ${reportPeriod.label}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Tanod Performance Report</Text>
            <Text style={styles.subtitle}>{reportTitle}</Text>
            <Text style={styles.reportInfo}>Generated on: {formattedDate}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* If there's a logo, uncomment this */}
            {/* <Image style={styles.logo} src="/path-to-logo.png" /> */}
          </View>
        </View>

        {/* Tanod Information */}
        <View style={styles.tanodInfo}>
          <View style={styles.tanodDetails}>
            <Text style={styles.tanodName}>{tanod.firstName} {tanod.middleName ? tanod.middleName + ' ' : ''}{tanod.lastName}</Text>
            <Text style={styles.tanodTitle}>{tanod.isTeamLeader ? 'Team Leader' : 'Barangay Tanod'}</Text>
            <Text style={styles.tanodContact}>Email: {tanod.email || 'N/A'}</Text>
            <Text style={styles.tanodContact}>Contact: {tanod.contactNumber || 'N/A'}</Text>
          </View>
        </View>

        {/* Performance Snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Snapshot</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Patrols</Text>
              <Text style={styles.statValue}>{performanceData.patrolStats.totalPatrols || 0}</Text>
              <Text style={styles.statSubtitle}>Total patrols</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Attendance</Text>
              <Text style={styles.statValue}>{performanceData.attendanceStats.attendanceRate || 0}%</Text>
              <Text style={styles.statSubtitle}>Attendance rate</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Incidents</Text>
              <Text style={styles.statValue}>{performanceData.incidentStats.totalIncidentResponses || 0}</Text>
              <Text style={styles.statSubtitle}>Incidents responded</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Rating</Text>
              <Text style={styles.statValue}>{performanceData.ratingsData.overallRating || '0.0'}</Text>
              <Text style={styles.statSubtitle}>Average rating</Text>
            </View>
          </View>
        </View>

        {/* Attendance Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Statistics</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Scheduled</Text>
              <Text style={styles.statValue}>{performanceData.attendanceStats.totalScheduled || 0}</Text>
              <Text style={styles.statSubtitle}>Total scheduled patrols</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Attended</Text>
              <Text style={styles.statValue}>{performanceData.attendanceStats.attended || 0}</Text>
              <Text style={styles.statSubtitle}>Patrols attended</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Absences</Text>
              <Text style={styles.statValue}>
                {(performanceData.attendanceStats.totalScheduled || 0) - (performanceData.attendanceStats.attended || 0)}
              </Text>
              <Text style={styles.statSubtitle}>Missed patrols</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>On-Time Rate</Text>
              <Text style={styles.statValue}>{performanceData.attendanceStats.onTimeRate || 0}%</Text>
              <Text style={styles.statSubtitle}>Arrived on schedule</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Avg. Delay</Text>
              <Text style={styles.statValue}>{performanceData.attendanceStats.averageDelay || 0} min</Text>
              <Text style={styles.statSubtitle}>When arriving late</Text>
            </View>
          </View>
        </View>
        
        {/* Incident Response */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Response</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Responses</Text>
              <Text style={styles.statValue}>{performanceData.incidentStats.totalIncidentResponses || 0}</Text>
              <Text style={styles.statSubtitle}>Incidents assigned</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Resolved</Text>
              <Text style={styles.statValue}>{performanceData.incidentStats.resolvedIncidents || 0}</Text>
              <Text style={styles.statSubtitle}>Successfully resolved</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Response Rate</Text>
              <Text style={styles.statValue}>{performanceData.incidentStats.responseRate || 0}%</Text>
              <Text style={styles.statSubtitle}>Resolution success rate</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Avg. Response Time</Text>
              <Text style={styles.statValue}>{performanceData.incidentStats.averageResponseTime || 0} min</Text>
              <Text style={styles.statSubtitle}>Average time to respond</Text>
            </View>
          </View>
        </View>
        
        {/* Areas Patrolled */}
        {performanceData.patrolStats.areasPatrolled && performanceData.patrolStats.areasPatrolled.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas Patrolled</Text>
            
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={styles.tableColLeft}><Text>Area Name</Text></View>
                <View style={styles.tableCol}><Text>Patrol Count</Text></View>
              </View>
              
              {performanceData.patrolStats.areasPatrolled.map((area, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                  <View style={styles.tableColLeft}><Text>{area.name || 'Unnamed Area'}</Text></View>
                  <View style={styles.tableCol}><Text>{area.patrolCount}</Text></View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Equipment Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Usage</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Borrowed</Text>
              <Text style={styles.statValue}>{performanceData.equipmentStats.totalBorrowed || 0}</Text>
              <Text style={styles.statSubtitle}>Items borrowed all time</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Currently Borrowed</Text>
              <Text style={styles.statValue}>{performanceData.equipmentStats.currentlyBorrowed || 0}</Text>
              <Text style={styles.statSubtitle}>Items not yet returned</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Return Rate</Text>
              <Text style={styles.statValue}>{performanceData.equipmentStats.returnRate || 0}%</Text>
              <Text style={styles.statSubtitle}>Returned on time</Text>
            </View>
          </View>
        </View>
        
        {/* Community Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Feedback</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Overall Rating</Text>
              <View>
                {renderStarRating(parseFloat(performanceData.ratingsData.overallRating) || 0)}
              </View>
              <Text style={styles.statSubtitle}>Based on {performanceData.ratingsData.comments?.length || 0} ratings</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Performance Ranking</Text>
              <Text style={styles.statValue}>
                Top {performanceData.performanceComparison.ratingPercentile || 0}%
              </Text>
              <Text style={styles.statSubtitle}>
                Rank {performanceData.performanceComparison.ratingRank || 0} of {performanceData.performanceComparison.totalTanods || 0} tanods
              </Text>
            </View>
          </View>
          
          {/* Recent Comments */}
          {performanceData.ratingsData.comments && performanceData.ratingsData.comments.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 10 }]}>Recent Comments</Text>
              
              <View style={styles.table}>
                {performanceData.ratingsData.comments.slice(0, 5).map((comment, index) => (
                  <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                    <View style={{ flex: 3, padding: 5 }}>
                      <Text>{comment.comment}</Text>
                      <Text style={styles.smallText}>- {comment.fullName || 'Anonymous'}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 5 }}>
                      <Text>Rating: {comment.rating}/5</Text>
                      <Text style={styles.smallText}>{format(new Date(comment.createdAt), 'MMM d, yyyy')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Performance Report for {tanod.firstName} {tanod.lastName} | {reportTitle} | Generated on {formattedDate}</Text>
          <Text>This report is confidential and intended for internal use only.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TanodPerformanceReport;
