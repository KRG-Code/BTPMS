import React from "react";

const TanodModal = ({
  showAddTanodModal,
  setShowAddTanodModal,
  showRemoveTanodModal,
  setShowRemoveTanodModal,
  tanods,
  selectedTanods,
  handleToggleCheckbox,
  handleAddSelectedTanods,
  handleRemoveSelectedTanods,
  checkedTanods,
}) => {
  return (
    <>
      {/* Add Tanod Modal */}
      {showAddTanodModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative TopNav">
            <h2 className="text-xl font-bold mb-4">Add Tanods</h2>
            <button
              onClick={() => setShowAddTanodModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <div className="overflow-y-auto h-64">
              {tanods
                .filter((tanod) => !selectedTanods.includes(tanod._id))
                .map((tanod) => (
                  <div key={tanod._id} className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      value={tanod._id}
                      onChange={() => handleToggleCheckbox(tanod._id)}
                      className="mr-2"
                      checked={checkedTanods.includes(tanod._id)}
                    />
                    <img
                      src={
                        tanod.profilePicture || "https://via.placeholder.com/50"
                      }
                      alt={tanod.firstName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {tanod.firstName} {tanod.lastName}
                  </div>
                ))}
            </div>
            <button
              onClick={handleAddSelectedTanods}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Add Selected
            </button>
          </div>
        </div>
      )}

      {/* Remove Tanod Modal */}
      {showRemoveTanodModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative TopNav">
            <h2 className="text-xl font-bold mb-4">Remove Tanods</h2>
            <button
              onClick={() => setShowRemoveTanodModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <div className="overflow-y-auto h-64">
              {selectedTanods.map((tanodId) => {
                const tanod = tanods.find((t) => t._id === tanodId);
                return (
                  <div key={tanodId} className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      onChange={() => handleToggleCheckbox(tanodId)}
                      className="mr-2"
                      checked={checkedTanods.includes(tanodId)}
                    />
                    <img
                      src={
                        tanod?.profilePicture ||
                        "https://via.placeholder.com/50"
                      }
                      alt={tanod?.firstName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {tanod?.firstName} {tanod?.lastName}
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleRemoveSelectedTanods}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Remove Selected
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TanodModal;