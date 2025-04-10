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

const ResourcesAuditReport = ({ data, category, period }) => {
  // Format today's date
  const formattedDate = format(new Date(), "MMMM dd, yyyy");
  
  // Format period dates
  let startDateFormatted = "Unknown";
  let endDateFormatted = "Unknown";
  
  try {
    if (period?.startDate) {
      startDateFormatted = format(new Date(period.startDate), "MMMM dd, yyyy");
    }
    if (period?.endDate) {
      endDateFormatted = format(new Date(period.endDate), "MMMM dd, yyyy");
    }
  } catch (error) {
    console.error("Error formatting dates:", error);
  }

  // Get the report title based on category
  const getReportTitle = () => {
    return category === 'equipment' 
      ? 'Equipment Audit Report'
      : 'Vehicle Usage Audit Report';
  };

  // Create safe data object with defaults for missing values
  const safeData = {
    title: getReportTitle(),
    reportType: (period?.reportType || "monthly").charAt(0).toUpperCase() + (period?.reportType || "monthly").slice(1),
    equipmentStats: data?.equipmentStats || {
      totalItems: 0,
      currentlyBorrowed: 0,
      returnRate: 0,
      overdueItems: 0
    },
    vehicleStats: data?.vehicleStats || {
      totalVehicles: 0,
      inUseVehicles: 0,
      totalTrips: 0,
      totalDistance: 0,
      maintenanceCount: 0
    },
    topBorrowers: data?.topBorrowers || [],
    mostBorrowedItems: data?.mostBorrowedItems || [],
    mostUsedVehicles: data?.mostUsedVehicles || [],
    topDrivers: data?.topDrivers || [],
    recentTransactions: data?.recentTransactions || []
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{safeData.title}</Text>
            <Text style={styles.subtitle}>San Agustin Barangay Tanod Management System</Text>
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
          <Text style={styles.summaryTitle}>Audit Summary</Text>
          <Text style={styles.summaryText}>Report Type: {safeData.reportType}</Text>
          <Text style={styles.summaryText}>Audit Period: {startDateFormatted} to {endDateFormatted}</Text>
        </View>

        {/* Equipment Stats Section */}
        {category === 'equipment' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment Overview</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Equipment</Text>
                  <Text style={styles.statValue}>{safeData.equipmentStats.totalItems}</Text>
                  <Text style={styles.statSubtitle}>Available in inventory</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Currently Borrowed</Text>
                  <Text style={styles.statValue}>{safeData.equipmentStats.currentlyBorrowed}</Text>
                  <Text style={styles.statSubtitle}>Items checked out</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Return Rate</Text>
                  <Text style={styles.statValue}>{safeData.equipmentStats.returnRate}%</Text>
                  <Text style={styles.statSubtitle}>On-time returns</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Overdue Items</Text>
                  <Text style={styles.statValue}>{safeData.equipmentStats.overdueItems}</Text>
                  <Text style={styles.statSubtitle}>Past due date</Text>
                </View>
              </View>
            </View>

            {/* Top Borrowers */}
            {safeData.topBorrowers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Equipment Borrowers</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={{ flex: 0.5 }}><Text>Rank</Text></View>
                    <View style={styles.tableColLeft}><Text>Name</Text></View>
                    <View style={styles.tableCol}><Text>Items Borrowed</Text></View>
                    <View style={styles.tableCol}><Text>Return Rate</Text></View>
                    <View style={styles.tableCol}><Text>Avg. Days Kept</Text></View>
                  </View>
                  
                  {safeData.topBorrowers.map((borrower, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                      <View style={{ flex: 0.5, padding: 5 }}><Text>{index + 1}</Text></View>
                      <View style={styles.tableColLeft}>
                        <Text>{borrower.name || 'Unnamed Tanod'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.itemsBorrowed || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.returnRate || 0}%</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.averageDaysKept || 0}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Most Borrowed Items */}
            {safeData.mostBorrowedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Borrowed Equipment</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={{ flex: 0.5 }}><Text>Rank</Text></View>
                    <View style={styles.tableColLeft}><Text>Item Name</Text></View>
                    <View style={styles.tableCol}><Text>Times Borrowed</Text></View>
                    <View style={styles.tableCol}><Text>Currently Available</Text></View>
                    <View style={styles.tableCol}><Text>Damage Rate</Text></View>
                  </View>
                  
                  {safeData.mostBorrowedItems.map((item, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                      <View style={{ flex: 0.5, padding: 5 }}><Text>{index + 1}</Text></View>
                      <View style={styles.tableColLeft}>
                        <Text>{item.name || 'Unnamed Item'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.borrowCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.availableCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.damageRate || 0}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Vehicle Stats Section */}
        {category === 'vehicle' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Fleet Overview</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Vehicles</Text>
                  <Text style={styles.statValue}>{safeData.vehicleStats.totalVehicles}</Text>
                  <Text style={styles.statSubtitle}>In the fleet</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Active Vehicles</Text>
                  <Text style={styles.statValue}>{safeData.vehicleStats.inUseVehicles}</Text>
                  <Text style={styles.statSubtitle}>Currently in use</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Trips</Text>
                  <Text style={styles.statValue}>{safeData.vehicleStats.totalTrips}</Text>
                  <Text style={styles.statSubtitle}>Completed in period</Text>
                </View>
              </View>
              
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Distance</Text>
                  <Text style={styles.statValue}>{safeData.vehicleStats.totalDistance} km</Text>
                  <Text style={styles.statSubtitle}>Traveled in period</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Maintenance Count</Text>
                  <Text style={styles.statValue}>{safeData.vehicleStats.maintenanceCount}</Text>
                  <Text style={styles.statSubtitle}>Services performed</Text>
                </View>
              </View>
            </View>

            {/* Most Used Vehicles */}
            {safeData.mostUsedVehicles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Used Vehicles</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={{ flex: 0.5 }}><Text>Rank</Text></View>
                    <View style={styles.tableColLeft}><Text>Vehicle</Text></View>
                    <View style={styles.tableCol}><Text>Total Trips</Text></View>
                    <View style={styles.tableCol}><Text>Total Distance</Text></View>
                    <View style={styles.tableCol}><Text>Status</Text></View>
                  </View>
                  
                  {safeData.mostUsedVehicles.map((vehicle, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                      <View style={{ flex: 0.5, padding: 5 }}><Text>{index + 1}</Text></View>
                      <View style={styles.tableColLeft}>
                        <Text>{vehicle.name || 'Unnamed Vehicle'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.tripCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.totalDistance || 0} km</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.status || 'Unknown'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top Drivers */}
            {safeData.topDrivers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Vehicle Operators</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={{ flex: 0.5 }}><Text>Rank</Text></View>
                    <View style={styles.tableColLeft}><Text>Driver Name</Text></View>
                    <View style={styles.tableCol}><Text>Vehicle Assignments</Text></View>
                    <View style={styles.tableCol}><Text>Total Trips</Text></View>
                    <View style={styles.tableCol}><Text>Safety Rating</Text></View>
                  </View>
                  
                  {safeData.topDrivers.map((driver, index) => (
                    <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                      <View style={{ flex: 0.5, padding: 5 }}><Text>{index + 1}</Text></View>
                      <View style={styles.tableColLeft}>
                        <Text>{driver.name || 'Unnamed Driver'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.vehicleCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.tripCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.safetyRating || '0.0'}/5.0</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Recent Transactions */}
        {safeData.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent {category === 'equipment' ? 'Equipment' : 'Vehicle'} Transactions</Text>
            
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <View style={styles.tableColLeft}><Text>Date</Text></View>
                <View style={styles.tableColLeft}><Text>User</Text></View>
                <View style={styles.tableColLeft}><Text>{category === 'equipment' ? 'Item' : 'Vehicle'}</Text></View>
                <View style={styles.tableCol}><Text>Action</Text></View>
                <View style={styles.tableColLeft}><Text>Notes</Text></View>
              </View>
              
              {safeData.recentTransactions.map((transaction, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                  <View style={styles.tableColLeft}>
                    <Text>{transaction.date ? format(new Date(transaction.date), "MMM dd, yyyy") : 'Unknown'}</Text>
                  </View>
                  <View style={styles.tableColLeft}>
                    <Text>{transaction.userName || 'Unknown User'}</Text>
                  </View>
                  <View style={styles.tableColLeft}>
                    <Text>{transaction.itemName || 'Unknown Item'}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text>{transaction.action || 'Unknown Action'}</Text>
                  </View>
                  <View style={styles.tableColLeft}>
                    <Text>{transaction.notes || '-'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          
          {category === 'equipment' ? (
            <>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Equipment Maintenance</Text>
                <Text style={styles.highlightValue}>
                  {safeData.equipmentStats.overdueItems > 5 ? (
                    `There are ${safeData.equipmentStats.overdueItems} overdue items. Follow up with tanods to recover equipment.`
                  ) : (
                    'Equipment return rate is at a good level. Continue monitoring to maintain compliance.'
                  )}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Inventory Management</Text>
                <Text style={styles.highlightValue}>
                  {safeData.equipmentStats.currentlyBorrowed / safeData.equipmentStats.totalItems > 0.8 ? (
                    'Most equipment is currently borrowed. Consider acquiring additional high-demand items.'
                  ) : (
                    'Current inventory levels appear adequate for tanod operational needs.'
                  )}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Vehicle Utilization</Text>
                <Text style={styles.highlightValue}>
                  {safeData.vehicleStats.inUseVehicles / safeData.vehicleStats.totalVehicles > 0.8 ? (
                    'Vehicle fleet is being heavily utilized. Consider adding vehicles if demand continues.'
                  ) : (
                    'Vehicle utilization is at a manageable level. Continue monitoring usage patterns.'
                  )}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Maintenance Schedule</Text>
                <Text style={styles.highlightValue}>
                  {safeData.vehicleStats.maintenanceCount > 0 ? (
                    `${safeData.vehicleStats.maintenanceCount} maintenance services were performed during this period. Ensure regular maintenance schedule is followed.`
                  ) : (
                    'No maintenance was recorded in this period. Schedule preventive maintenance to avoid future issues.'
                  )}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>{safeData.title} | Generated on {formattedDate}</Text>
          <Text>This report is confidential and intended for internal use only.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ResourcesAuditReport;
