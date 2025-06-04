import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import React, { useEffect, useState } from "react";

function Checklistdb() {
  const [checklistData, setChecklistData] = useState([]);
  const email = localStorage.getItem("email"); // Ambil email dari local storage
  console.log("Email: ", email);

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        const response = await fetch("http://103.163.184.111:3000/inventory_m3e");
        const data = await response.json();

        // Filter data berdasarkan email
        const filteredData = data
          .filter((item) => item.email === email)
          .map((item, index) => ({
            id: index + 1, // Auto-generate #
            date: new Date(item.timestamp).toISOString().split("T")[0], // Format Date (YYYY-MM-DD)
            code: item.project_code, // Project Code
            Flightid: "", // Kosongkan Flight ID
            uav: item.equipment, // UAV
            Payload: "", // Kosongkan Payload
          }));

        setChecklistData(filteredData);
      } catch (error) {
        console.error("Error fetching checklist data:", error);
      }
    };

    if (email) {
      fetchChecklistData();
    }
  }, [email]);

  return (
    <div className="container-fluid">
      <h3 className="mt-3 ms-2">Checklist Database</h3>
      <table className="table text-center table-bordered" style={{ borderColor: "#143893" }}>
        <thead>
          <tr>
            <th scope="col" style={{ width: "5%", backgroundColor: "#143893", color: "#CCE6FF" }}>#</th>
            <th scope="col" style={{ width: "15%", backgroundColor: "#143893", color: "#CCE6FF" }}>Date</th>
            <th scope="col" style={{ width: "20%", backgroundColor: "#143893", color: "#CCE6FF" }}>Project Code</th>
            <th scope="col" style={{ width: "15%", backgroundColor: "#143893", color: "#CCE6FF" }}>Flight ID</th>
            <th scope="col" style={{ width: "15%", backgroundColor: "#143893", color: "#CCE6FF" }}>UAV</th>
            <th scope="col" style={{ width: "15%", backgroundColor: "#143893", color: "#CCE6FF" }}>Payload</th>
            <th scope="col" style={{ width: "15%", backgroundColor: "#143893", color: "#CCE6FF" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {checklistData.map((checklist) => (
            <tr key={checklist.id}>
              <th scope="row">{checklist.id}</th>
              <td>{checklist.date}</td>
              <td>{checklist.code}</td>
              <td>{checklist.Flightid}</td>
              <td>{checklist.uav}</td>
              <td>{checklist.Payload}</td>
              <td>
                <div className="d-flex justify-content-center">
                  <button type="button" className="btn btn-warning btn-outline-light me-3">
                    <i className="bi bi-eye"></i>
                  </button>
                  <button type="button" className="btn btn-danger btn-outline-light">
                    <i className="bi bi-download"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Checklistdb;


