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
    width: 80,
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
    minHeight: 25,
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
    fontSize: 8,
  },
  tableColLeft: {
    flex: 1,
    padding: 5,
    textAlign: 'left',
    fontSize: 8,
  },
  tableColRight: {
    flex: 1,
    padding: 5,
    textAlign: 'right',
    fontSize: 8,
  },
  smallText: {
    fontSize: 9,
    color: '#666',
  },
  statisticsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statBox: {
    width: '30%',
    margin: '0 1.5%',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
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
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 3,
    borderRadius: 2,
  },
  periodBadge: {
    marginTop: 5,
    backgroundColor: '#dbeafe',
    padding: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
    fontSize: 10,
    color: '#1e40af',
  },
  chart: {
    height: 150,
    marginVertical: 10,
  },
  noDataMessage: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 5,
    backgroundColor: '#f9fafb',
  },
});

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

// Format time
const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'hh:mm a');
  } catch (error) {
    return '';
  }
};

const ResolvedIncidentReport = ({ 
  incidents, 
  falseAlarms, 
  generatedDate, 
  dateRange,
  reportPeriod = 'custom',
  periodDisplay = '',
  reportType = 'all'
}) => {
  // Calculate statistics
  const totalIncidents = incidents.length;
  const totalFalseAlarms = falseAlarms.length;
  const totalReported = totalIncidents + totalFalseAlarms;
  
  // Calculate percentages
  const resolvedPercentage = totalReported > 0 ? ((totalIncidents / totalReported) * 100).toFixed(1) : 0;
  const falseAlarmPercentage = totalReported > 0 ? ((totalFalseAlarms / totalReported) * 100).toFixed(1) : 0;
  
  // Group incidents by type
  const typeStats = {};
  incidents.forEach(incident => {
    const type = incident.type || 'Unknown';
    typeStats[type] = (typeStats[type] || 0) + 1;
  });
  
  // Sort incidents by date (newest first)
  const sortedIncidents = [...incidents].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Sort false alarms by date (newest first)
  const sortedFalseAlarms = [...falseAlarms].sort((a, b) => new Date(b.markedAt || b.date) - new Date(a.markedAt || a.date));

  // Get report title based on report type
  const getReportTitle = () => {
    switch (reportType) {
      case 'resolved':
        return 'Resolved Incidents Report';
      case 'falseAlarm':
        return 'False Alarm Report';
      default:
        return 'Incident Resolution Report';
    }
  };

  // Get report period text
  const getReportPeriodText = () => {
    if (reportPeriod === 'custom') {
      return `${formatDate(dateRange?.startDate)} - ${formatDate(dateRange?.endDate)}`;
    }
    return periodDisplay;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{getReportTitle()}</Text>
            <Text style={styles.subtitle}>Barangay San Agustin Tanod Patrol Management System</Text>
            <Text style={styles.reportInfo}>
              Report Period: {getReportPeriodText()}
            </Text>
            {reportPeriod !== 'custom' && (
              <View style={styles.periodBadge}>
                <Text>{reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} Report</Text>
              </View>
            )}
            <Text style={styles.reportInfo}>
              Generated on: {format(new Date(generatedDate), 'MMMM dd, yyyy hh:mm a')}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Image src="/icon.png" style={styles.logo} />
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Statistics</Text>
          <View style={styles.statisticsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Incidents</Text>
              <Text style={styles.statValue}>{totalReported}</Text>
            </View>
            {(reportType === 'all' || reportType === 'resolved') && (
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>Resolved</Text>
                <Text style={styles.statValue}>
                  {totalIncidents} {reportType === 'all' ? `(${resolvedPercentage}%)` : ''}
                </Text>
              </View>
            )}
            {(reportType === 'all' || reportType === 'falseAlarm') && (
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>False Alarms</Text>
                <Text style={styles.statValue}>
                  {totalFalseAlarms} {reportType === 'all' ? `(${falseAlarmPercentage}%)` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Resolved Incidents Section */}
        {(reportType === 'all' || reportType === 'resolved') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolved Incidents ({totalIncidents})</Text>
            
            {totalIncidents > 0 ? (
              <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableRowHeader]}>
                  <Text style={[styles.tableCol, { flex: 1.5 }]}>Type</Text>
                  <Text style={styles.tableCol}>Classification</Text>
                  <Text style={styles.tableCol}>Date</Text>
                  <Text style={[styles.tableCol, { flex: 1.5 }]}>Location</Text>
                  <Text style={styles.tableCol}>Resolved By</Text>
                  <Text style={styles.tableCol}>Resolution Date</Text>
                </View>
                
                {/* Table Rows */}
                {sortedIncidents.map((incident, index) => (
                  <View key={index} style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowEven : {}
                  ]}>
                    <Text style={[styles.tableColLeft, { flex: 1.5 }]}>{incident.type || 'N/A'}</Text>
                    <Text style={styles.tableCol}>{incident.incidentClassification || 'Normal'}</Text>
                    <Text style={styles.tableCol}>{formatDate(incident.date)}</Text>
                    <Text style={[styles.tableColLeft, { flex: 1.5 }]}>{incident.address || incident.location || 'N/A'}</Text>
                    <Text style={styles.tableCol}>{incident.resolvedByFullName || 'N/A'}</Text>
                    <Text style={styles.tableCol}>{formatDate(incident.resolvedAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataMessage}>No resolved incidents during this period.</Text>
            )}
          </View>
        )}

        {/* False Alarms Section */}
        {(reportType === 'all' || reportType === 'falseAlarm') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>False Alarms ({totalFalseAlarms})</Text>
            
            {totalFalseAlarms > 0 ? (
              <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableRowHeader]}>
                  <Text style={[styles.tableCol, { flex: 1.5 }]}>Type</Text>
                  <Text style={styles.tableCol}>Classification</Text>
                  <Text style={styles.tableCol}>Original Date</Text>
                  <Text style={[styles.tableCol, { flex: 1.5 }]}>Location</Text>
                  <Text style={styles.tableCol}>Marked By</Text>
                  <Text style={styles.tableCol}>Marked At</Text>
                </View>
                
                {/* Table Rows */}
                {sortedFalseAlarms.map((alarm, index) => (
                  <View key={index} style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowEven : {}
                  ]}>
                    <Text style={[styles.tableColLeft, { flex: 1.5 }]}>{alarm.type || 'N/A'}</Text>
                    <Text style={styles.tableCol}>{alarm.incidentClassification || 'Normal'}</Text>
                    <Text style={styles.tableCol}>{formatDate(alarm.date)}</Text>
                    <Text style={[styles.tableColLeft, { flex: 1.5 }]}>{alarm.address || alarm.location || 'N/A'}</Text>
                    <Text style={styles.tableCol}>
                      {alarm.markedByUser?.firstName || ''} {alarm.markedByUser?.lastName || ''}
                    </Text>
                    <Text style={styles.tableCol}>{formatDate(alarm.markedAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataMessage}>No false alarms during this period.</Text>
            )}
          </View>
        )}

        {/* Incident Types */}
        {(reportType === 'all' || reportType === 'resolved') && totalIncidents > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Types Breakdown</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <Text style={styles.tableColLeft}>Incident Type</Text>
                <Text style={styles.tableColRight}>Count</Text>
                <Text style={styles.tableColRight}>Percentage</Text>
              </View>
              {Object.entries(typeStats).sort((a, b) => b[1] - a[1]).map(([type, count], index) => (
                <View key={type} style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowEven : {}
                ]}>
                  <Text style={styles.tableColLeft}>{type}</Text>
                  <Text style={styles.tableColRight}>{count}</Text>
                  <Text style={styles.tableColRight}>
                    {((count / totalIncidents) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>© {new Date().getFullYear()} Barangay San Agustin Tanod Patrol Management System</Text>
          <Text>This is an official document. Unauthorized alteration or reproduction is prohibited.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ResolvedIncidentReport;
