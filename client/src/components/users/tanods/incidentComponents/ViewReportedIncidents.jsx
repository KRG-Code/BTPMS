import React from "react";

const ViewReportedIncidents = ({ incidentLog, setShowReportedIncidents }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex justify-between items-center">
          Reported Incidents
          <button
            onClick={() => setShowReportedIncidents(false)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        </h2>
        <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
          <ul className="list-disc list-inside">
            {incidentLog.length > 0 ? (
              incidentLog.map((inc, index) => (
                <li key={index} className="border-b py-2 text-sm md:text-base">
                  {`Type: ${inc.type}, Description: ${inc.description}, Location: ${inc.location}`}
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-sm md:text-base">No reported incidents.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ViewReportedIncidents;
