import React from "react";

const ReportIncident = ({ incident, setIncident, setIncidentLog, incidentLog, setShowReportIncident }) => {
  const handleIncidentChange = (e) => {
    setIncident({ ...incident, [e.target.name]: e.target.value });
  };

  const reportIncident = () => {
    setIncidentLog([...incidentLog, incident]);
    setIncident({ type: "", description: "", location: "" });
    setShowReportIncident(false); // Close the modal after reporting the incident
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex justify-between items-center">
          Report an Incident
          <button
            onClick={() => setShowReportIncident(false)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="type"
            placeholder="Incident Type"
            value={incident.type}
            onChange={handleIncidentChange}
            className="border p-2 mb-2 w-full rounded text-sm md:text-base text-black"
          />
          <input
            type="text"
            name="description"
            placeholder="Incident Description"
            value={incident.description}
            onChange={handleIncidentChange}
            className="border p-2 mb-2 w-full rounded text-sm md:text-base text-black"
          />
          <input
            type="text"
            name="location"
            placeholder="Incident Location"
            value={incident.location}
            onChange={handleIncidentChange}
            className="border p-2 mb-4 w-full rounded text-sm md:text-base text-black"
          />
          <button onClick={reportIncident} className="bg-green-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded shadow hover:bg-green-700 transition">
            Submit Incident
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;
