import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import logo from '../../../common/icon.png';

// Create styles with more appropriate font sizes
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
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  reportInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 6,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e40af',
    backgroundColor: '#f3f4f6',
    padding: 4,
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
    minHeight: 24,
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
    padding: 4,
    textAlign: 'center',
    fontSize: 8,
  },
  tableColLeft: {
    flex: 1.5,
    padding: 4,
    textAlign: 'left',
    fontSize: 8,
  },
  tableColRight: {
    flex: 1,
    padding: 4,
    textAlign: 'right',
    fontSize: 8,
  },
  smallText: {
    fontSize: 8,
    color: '#666',
  },
  normalText: {
    fontSize: 9,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  statTitle: {
    fontSize: 8,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statSubtitle: {
    fontSize: 7,
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
    padding: 8,
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  highlightBox: {
    backgroundColor: '#e5edff',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  highlightTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  highlightValue: {
    fontSize: 8,
    color: '#4b5563',
  },
  chartContainer: {
    height: 120,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '90%',
    paddingTop: 10,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  barLabel: {
    fontSize: 6,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
});

const ResourcesAuditReport = ({ data, category, period }) => {
  // Format today's date
  const formattedDate = format(new Date(), "MMMM dd, yyyy");
  
  // Format period dates with error handling
  let startDateFormatted = "Unknown";
  let endDateFormatted = "Unknown";
  
  try {
    if (period.startDate) {
      startDateFormatted = format(new Date(period.startDate), "MMMM dd, yyyy");
    }
    if (period.endDate) {
      endDateFormatted = format(new Date(period.endDate), "MMMM dd, yyyy");
    }
  } catch (error) {
    console.error("Error formatting dates:", error);
  }
  
  // Helper function to ensure a property exists in an object
  const safelyGet = (obj, path, defaultValue = 0) => {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current[key] === undefined || current[key] === null) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  };

  // Format dates properly with specific handling for 1970-01-01 date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    
    // Check for 1970-01-01 date which indicates "Not Yet Returned"
    if (dateStr === "1970-01-01T00:00:00.000Z" || 
        dateStr.startsWith("1970-01-01") || 
        new Date(dateStr).getFullYear() === 1970) {
      return "Not Yet Returned";
    }
    
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };
  
  // Format numbers with handling for zero values
  const formatNumber = (value, suffix = '', defaultText = 'N/A') => {
    if (value === undefined || value === null) return defaultText;
    if (value === 0) return `0${suffix}`;
    return `${value}${suffix}`;
  };
  
  // Format percentage with handling for zero values
  const formatPercent = (value, defaultText = 'N/A') => {
    if (value === undefined || value === null) return defaultText;
    return `${value}%`;
  };
  
  // Choose the proper title and content based on category
  let reportTitle = "Resource Audit Report";
  let reportSubtitle = "Inventory and Equipment Usage Analysis";
  
  if (category === 'vehicle') {
    reportTitle = "Vehicle Audit Report";
    reportSubtitle = "Comprehensive Vehicle Usage and Assignment Analysis";
  } else if (category === 'equipment') {
    reportTitle = "Equipment Audit Report";
    reportSubtitle = "Detailed Equipment Borrowing and Inventory Analysis";
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{reportTitle}</Text>
            <Text style={styles.subtitle}>{reportSubtitle}</Text>
            <Text style={styles.reportInfo}>Generated on: {formattedDate}</Text>
            <Text style={styles.reportInfo}>Report Period: {startDateFormatted} to {endDateFormatted}</Text>
            <Text style={styles.reportInfo}>Report Type: {period.reportType || 'Monthly'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Image style={styles.logo} src={logo} />
          </View>
        </View>
        
        {/* Summary Section */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Executive Summary</Text>
          
          {category === 'vehicle' && (
            <>
              <Text style={styles.summaryText}>
                <Text style={{fontWeight: 'bold'}}>Vehicles:</Text> Total Vehicles: {safelyGet(data, 'vehicleStats.totalVehicles')} | 
                In-Use: {safelyGet(data, 'vehicleStats.activeVehicles')} |
                Maintenance: {safelyGet(data, 'vehicleStats.maintenanceVehicles')}
              </Text>
              <Text style={styles.summaryText}>
                Total Trips: {safelyGet(data, 'vehicleStats.totalTrips')} |
                Total Mileage: {safelyGet(data, 'vehicleStats.totalMileage')} km |
                Avg Trip Mileage: {safelyGet(data, 'vehicleStats.averageMileage') || 0} km
              </Text>
              <Text style={styles.summaryText}>
                This report provides a comprehensive analysis of vehicle usage patterns, trip history, 
                and driver assignments for the specified period.
              </Text>
            </>
          )}
          
          {category === 'equipment' && (
            <>
              <Text style={styles.summaryText}>
                <Text style={{fontWeight: 'bold'}}>Equipment & Inventory:</Text> 
                Total Items: {safelyGet(data, 'equipmentStats.totalItems')} | 
                Available Items: {safelyGet(data, 'equipmentStats.availableItems')} |
                Borrowed Items: {safelyGet(data, 'equipmentStats.borrowedItems')}
              </Text>
              <Text style={styles.summaryText}>
                Total Transactions: {safelyGet(data, 'equipmentStats.totalTransactions')} |
                Borrowed and Returned: {safelyGet(data, 'equipmentStats.returnedItems')} |
                Active Borrowers: {safelyGet(data, 'topBorrowers.length') || 0}
              </Text>
              <Text style={styles.summaryText}>
                This detailed report analyzes equipment borrowing trends, inventory status, user behavior patterns,
                and identifies potential issues with specific items or borrowing practices.
              </Text>
            </>
          )}
        </View>
        
        {/* Vehicle Stats Section */}
        {category === 'vehicle' && (
          <>
            {/* Vehicle Usage Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Usage Statistics</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Vehicles</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.totalVehicles')}</Text>
                  <Text style={styles.statSubtitle}>In fleet</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Active Vehicles</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.activeVehicles')}</Text>
                  <Text style={styles.statSubtitle}>Currently in use</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Trips</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.totalTrips')}</Text>
                  <Text style={styles.statSubtitle}>Completed</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Mileage</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.totalMileage')}</Text>
                  <Text style={styles.statSubtitle}>Kilometers traveled</Text>
                </View>
              </View>
              
              {/* Additional Vehicle Statistics */}
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Avg Trip Mileage</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.averageMileage') || 0}</Text>
                  <Text style={styles.statSubtitle}>Kilometers per trip</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Maintenance Rate</Text>
                  <Text style={styles.statValue}>{
                    ((safelyGet(data, 'vehicleStats.maintenanceVehicles') / 
                    Math.max(safelyGet(data, 'vehicleStats.totalVehicles'), 1)) * 100).toFixed(1)
                  }%</Text>
                  <Text style={styles.statSubtitle}>Vehicles in service</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Fleet Utilization</Text>
                  <Text style={styles.statValue}>{
                    ((safelyGet(data, 'vehicleStats.activeVehicles') / 
                    Math.max(safelyGet(data, 'vehicleStats.totalVehicles'), 1)) * 100).toFixed(1)
                  }%</Text>
                  <Text style={styles.statSubtitle}>Active vehicles</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Most Common Trip</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'vehicleStats.mostCommonReason') || "N/A"}</Text>
                  <Text style={styles.statSubtitle}>Trip reason</Text>
                </View>
              </View>
            </View>
            
            {/* Monthly Usage Chart */}
            {data.monthlyVehicleUsage?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Usage Distribution</Text>
                
                <View style={styles.chartContainer}>
                  <View style={styles.barChart}>
                    {(data.monthlyVehicleUsage || []).map((month, index) => (
                      <View key={index} style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              height: `${Math.min((month.count / (safelyGet(data, 'vehicleStats.maxMonthlyUsage') || 1)) * 100, 100)}%`,
                              backgroundColor: index % 2 === 0 ? '#3b82f6' : '#4f46e5'
                            }
                          ]} 
                        />
                        <Text style={styles.barLabel}>{month.name}</Text>
                        <Text style={[styles.barLabel, { fontWeight: 'bold' }]}>{month.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Most Used Vehicles Table */}
            {data.mostUsedVehicles?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Used Vehicles</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableColLeft}><Text>Vehicle Name</Text></View>
                    <View style={styles.tableCol}><Text>License Plate</Text></View>
                    <View style={styles.tableCol}><Text>Model</Text></View>
                    <View style={styles.tableCol}><Text>Trip Count</Text></View>
                    <View style={styles.tableCol}><Text>Total Mileage</Text></View>
                    <View style={styles.tableCol}><Text>Status</Text></View>
                  </View>
                  
                  {data.mostUsedVehicles.map((vehicle, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableColLeft}>
                        <Text>{vehicle.name || 'Unknown Vehicle'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.licensePlate || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.model || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.tripCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.totalMileage || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{vehicle.status || 'Unknown'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Top Drivers Table */}
            {data.topDrivers?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Drivers</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableColLeft}><Text>Driver Name</Text></View>
                    <View style={styles.tableCol}><Text>Total Trips</Text></View>
                    <View style={styles.tableCol}><Text>Total Mileage</Text></View>
                    <View style={styles.tableCol}><Text>Avg Trip Mileage</Text></View>
                    <View style={styles.tableCol}><Text>Most Common Reason</Text></View>
                  </View>
                  
                  {data.topDrivers.map((driver, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableColLeft}>
                        <Text>{driver.name || 'Unknown Driver'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.tripCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.totalMileage || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.totalMileage && driver.tripCount ? (driver.totalMileage / driver.tripCount).toFixed(1) : '0'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{driver.mostCommonReason || 'N/A'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Vehicle Transactions Table */}
            {data.recentTransactions?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Vehicle Usage</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableCol}><Text>Date</Text></View>
                    <View style={styles.tableColLeft}><Text>User</Text></View>
                    <View style={styles.tableColLeft}><Text>Vehicle</Text></View>
                    <View style={styles.tableCol}><Text>Start Mileage</Text></View>
                    <View style={styles.tableCol}><Text>End Mileage</Text></View>
                    <View style={styles.tableCol}><Text>Used</Text></View>
                    <View style={styles.tableColLeft}><Text>Reason</Text></View>
                  </View>
                  
                  {data.recentTransactions.map((tx, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableCol}>
                        <Text>{format(new Date(tx.date), "MM/dd/yyyy")}</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{tx.userName || 'Unknown'}</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{tx.vehicleName || 'Unknown'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{tx.startMileage || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{tx.endMileage || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{tx.mileageUsed || 0} km</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{tx.reason || '-'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Fleet Analysis & Recommendations</Text>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Vehicle Utilization</Text>
                <Text style={styles.highlightValue}>
                  {safelyGet(data, 'vehicleStats.activeVehicles') < 
                   safelyGet(data, 'vehicleStats.totalVehicles') * 0.7 
                    ? "Current vehicle utilization is below optimal levels. Consider reassigning vehicles or reducing fleet size."
                    : "Vehicle utilization is at a healthy level. Continue monitoring for potential need for additional vehicles."}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Trip Analysis</Text>
                <Text style={styles.highlightValue}>
                  {safelyGet(data, 'vehicleStats.totalTrips') > 0
                    ? `The most common trip reason is "${safelyGet(data, 'vehicleStats.mostCommonReason') || 'Emergency Response'}", accounting for ${safelyGet(data, 'vehicleStats.mostCommonReasonPercent') || 0}% of all trips.`
                    : "No trip patterns have been identified during this reporting period."}
                </Text>
                <Text style={styles.highlightValue}>
                  {safelyGet(data, 'vehicleStats.totalMileage') > 1000
                    ? "High total mileage indicates the need for comprehensive vehicle inspections."
                    : "Mileage is within expected parameters for this reporting period."}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Driver Performance</Text>
                <Text style={styles.highlightValue}>
                  {data.topDrivers && data.topDrivers.length > 0
                    ? `Top performing driver is ${data.topDrivers[0].name} with ${data.topDrivers[0].tripCount} trips covering ${data.topDrivers[0].totalMileage} kilometers.`
                    : "No driver performance data available for this period."}
                </Text>
              </View>
            </View>
          </>
        )}
        
        {/* Equipment Stats Section */}
        {category === 'equipment' && (
          <>
            {/* Equipment Usage Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment & Inventory Overview</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Inventory</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.totalItems')}</Text>
                  <Text style={styles.statSubtitle}>Items recorded</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Available Items</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.availableItems')}</Text>
                  <Text style={styles.statSubtitle}>Ready for use</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Currently Borrowed</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.borrowedItems')}</Text>
                  <Text style={styles.statSubtitle}>Items checked out</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Return Rate</Text>
                  <Text style={styles.statValue}>{formatPercent(safelyGet(data, 'equipmentStats.returnRate'))}</Text>
                  <Text style={styles.statSubtitle}>Items returned</Text>
                </View>
              </View>
              
              {/* Additional Equipment Statistics */}
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Total Transactions</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.totalTransactions')}</Text>
                  <Text style={styles.statSubtitle}>Borrow events</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Utilization Rate</Text>
                  <Text style={styles.statValue}>
                    {formatPercent(((safelyGet(data, 'equipmentStats.borrowedItems') / 
                    Math.max(safelyGet(data, 'equipmentStats.totalItems'), 1)) * 100).toFixed(1))}
                  </Text>
                  <Text style={styles.statSubtitle}>Of total inventory</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Active Borrowers</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.uniqueBorrowers') || 0}</Text>
                  <Text style={styles.statSubtitle}>Distinct users</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statTitle}>Returned Items</Text>
                  <Text style={styles.statValue}>{safelyGet(data, 'equipmentStats.returnedItems')}</Text>
                  <Text style={styles.statSubtitle}>This period</Text>
                </View>
              </View>
            </View>
            
            {/* Equipment Usage Chart */}
            {data.monthlyBorrowingTrends?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment Borrowing Trends</Text>
                
                <View style={styles.chartContainer}>
                  <View style={styles.barChart}>
                    {(data.monthlyBorrowingTrends || []).map((month, index) => (
                      <View key={index} style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              height: `${Math.min((month.count / (safelyGet(data, 'equipmentStats.maxMonthlyBorrows') || 1)) * 100, 100)}%`,
                              backgroundColor: index % 2 === 0 ? '#3b82f6' : '#4f46e5'
                            }
                          ]} 
                        />
                        <Text style={styles.barLabel}>{month.name}</Text>
                        <Text style={[styles.barLabel, { fontWeight: 'bold' }]}>{month.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Top Borrowers Table */}
            {data.topBorrowers?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Borrowers</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableColLeft}><Text>Name</Text></View>
                    <View style={styles.tableCol}><Text>Items Borrowed</Text></View>
                    <View style={styles.tableCol}><Text>Items Returned</Text></View>
                    <View style={styles.tableCol}><Text>Pending Returns</Text></View>
                    <View style={styles.tableCol}><Text>Last Borrowed</Text></View>
                  </View>
                  
                  {data.topBorrowers.map((borrower, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableColLeft}>
                        <Text>{borrower.name || 'Unknown User'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.itemsBorrowed || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.itemsReturned || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.pendingReturns || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{borrower.lastBorrowedDate ? formatDate(borrower.lastBorrowedDate) : 'N/A'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Most Borrowed Items Table */}
            {data.mostBorrowedItems?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Borrowed Items</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableColLeft}><Text>Item Name</Text></View>
                    <View style={styles.tableCol}><Text>Borrow Count</Text></View>
                    <View style={styles.tableCol}><Text>Total Quantity</Text></View>
                    <View style={styles.tableCol}><Text>Available</Text></View>
                    <View style={styles.tableCol}><Text>Currently Borrowed</Text></View>
                  </View>
                  
                  {data.mostBorrowedItems.map((item, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableColLeft}>
                        <Text>{item.name || 'Unknown Item'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.borrowCount || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.total || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{item.quantity || 0}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{(item.total - item.quantity) || 0}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Recent Equipment Transactions Table */}
            {data.recentTransactions?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Equipment Transactions</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableCol}><Text>Borrow Date</Text></View>
                    <View style={styles.tableCol}><Text>Return Date</Text></View>
                    <View style={styles.tableColLeft}><Text>User</Text></View>
                    <View style={styles.tableColLeft}><Text>Item</Text></View>
                    <View style={styles.tableCol}><Text>Status</Text></View>
                  </View>
                  
                  {data.recentTransactions.map((tx, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableCol}>
                        <Text>{format(new Date(tx.borrowDate), "MM/dd/yyyy")}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={tx.returnDate && 
                            (tx.returnDate === "1970-01-01T00:00:00.000Z" || 
                            tx.returnDate.startsWith("1970-01-01") || 
                            new Date(tx.returnDate).getFullYear() === 1970) ? 
                            {color: '#ef4444'} : {}}>
                          {tx.returnDate ? formatDate(tx.returnDate) : "Not Returned"}
                        </Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{tx.userName || 'Unknown'}</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{tx.itemName || 'Unknown'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{tx.returnDate && tx.returnDate !== "1970-01-01T00:00:00.000Z" ? 'Returned' : 'Borrowed'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Inventory Alerts */}
            {(data.inventoryAlerts && data.inventoryAlerts.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inventory Alerts & Issues</Text>
                
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={styles.tableColLeft}><Text>Item Name</Text></View>
                    <View style={styles.tableCol}><Text>Alert Type</Text></View>
                    <View style={styles.tableColLeft}><Text>Issue</Text></View>
                    <View style={styles.tableCol}><Text>Severity</Text></View>
                    <View style={styles.tableColLeft}><Text>Recommendation</Text></View>
                  </View>
                  
                  {data.inventoryAlerts.map((alert, index) => (
                    <View key={index} style={[
                      styles.tableRow, 
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <View style={styles.tableColLeft}>
                        <Text>{alert.itemName || 'Unknown Item'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{alert.alertType || 'General'}</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{alert.issue || 'Issue not specified'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text>{alert.severity || 'Medium'}</Text>
                      </View>
                      <View style={styles.tableColLeft}>
                        <Text>{alert.recommendation || 'Review item status'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory Management Recommendations</Text>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Inventory Utilization</Text>
                <Text style={styles.highlightValue}>
                  {safelyGet(data, 'equipmentStats.borrowedItems') > 
                   safelyGet(data, 'equipmentStats.totalItems') * 0.8
                    ? "Inventory utilization is very high. Consider acquiring additional equipment to meet demand."
                    : "Current inventory levels appear adequate for demand. Continue monitoring usage patterns."}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Return Process</Text>
                <Text style={styles.highlightValue}>
                  {safelyGet(data, 'equipmentStats.returnRate') < 80
                    ? "Return rate is below target. Consider implementing a clearer equipment return policy and reminder system."
                    : "Equipment return rate is good. Current policies appear effective."}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>User Behavior Patterns</Text>
                <Text style={styles.highlightValue}>
                  {data.topBorrowers && data.topBorrowers.length > 0 && 
                   data.topBorrowers[0].pendingReturns > 2
                    ? `User ${data.topBorrowers[0].name} has ${data.topBorrowers[0].pendingReturns} items pending return. Follow up may be necessary.`
                    : "No significant issues with user borrowing behaviors identified in this period."}
                </Text>
              </View>
              
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Inventory Organization</Text>
                <Text style={styles.highlightValue}>
                  {data.mostBorrowedItems && data.mostBorrowedItems.length > 0
                    ? `Most borrowed item is "${data.mostBorrowedItems[0].name}" with ${data.mostBorrowedItems[0].borrowCount} borrows. Consider increasing quantity if availability is low.`
                    : "Review current inventory organization to improve equipment accessibility."}
                </Text>
              </View>
            </View>
          </>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Resource Management Audit Report | Generated on {formattedDate}</Text>
          <Text>This report is confidential and intended for administrative use only.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ResourcesAuditReport;
