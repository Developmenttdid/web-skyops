import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Project.css";

function Project() {
  const [projectData, setProjectData] = useState([]);
  const [position, setPosition] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const email = localStorage.getItem("email");

  document.body.style.overflowY = "auto";
  document.body.style.overflowX = "hidden";

  useEffect(() => {
    const fetchUserPosition = async () => {
      try {
        const response = await fetch("http://103.163.184.111:3000/users");
        const users = await response.json();
        const loggedInUser = users.find((user) => user.email === email);
        if (loggedInUser) {
          setPosition(loggedInUser.position);
        }
      } catch (error) {
        console.error("Error fetching user position:", error);
      }
    };
    fetchUserPosition();
  }, [email]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(
          "http://103.163.184.111:3000/projectstatus"
        );
        const data = await response.json();
        const filteredData = data
          .filter((project) => project.email === email)
          .map((project) => ({
            id: project.id,
            code: project.project_code,
            location: project.city,
            date: new Date(project.created_at).toISOString().split("T")[0],
            progress: 50,
          }));
        setProjectData(filteredData);
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };
    fetchProjectData();
  }, [email]);

  const handleDelete = async (projectCode) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus proyek ${projectCode}?`
      )
    ) {
      return;
    }

    try {
      // 1️⃣ Fetch semua project dari server
      const response = await fetch("http://103.163.184.111:3000/projectstatus");
      const projects = await response.json();

      // 2️⃣ Cari project dengan project_code yang sama
      const projectToDelete = projects.find(
        (p) => p.project_code === projectCode
      );

      if (!projectToDelete) {
        alert("Proyek tidak ditemukan di database.");
        return;
      }

      const projectId = projectToDelete.id; // 🔹 Ambil ID proyek

      // 3️⃣ Kirim request DELETE ke server pakai ID proyek
      const deleteResponse = await fetch(
        `http://103.163.184.111:3000/projectstatus/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error("Gagal menghapus proyek dari database.");
      }

      // 4️⃣ Update state agar UI ikut berubah
      setProjectData((prevData) => prevData.filter((p) => p.id !== projectId));

      alert("Proyek berhasil dihapus!");
    } catch (error) {
      console.error("Error saat menghapus proyek:", error);
      alert("Terjadi kesalahan saat menghapus proyek.");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col ms-3">
          <h2>Project List</h2>
        </div>
        <div className="col">
          <Link to="/Project/ProjectStatus">
            <button
              type="button"
              className="button-add btn btn-success mb-3 me-3 mt-3"
              disabled={position !== "Project Manager" && position !== "Admin"}
            >
              <i className="bi bi-plus"></i> Add Project
            </button>
          </Link>
        </div>
      </div>

      <div className="container-fluid">
        <table className="table text-center table-bordered">
          <thead>
            <tr>
              <th
                scope="col"
                style={{
                  width: "5%",
                  backgroundColor: "#143893",
                  color: "#CCE6FF",
                }}
              >
                #
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Project Code
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Location
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Date Created
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Last Update
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Progress
              </th>
              <th
                scope="col"
                style={{ backgroundColor: "#143893", color: "#CCE6FF" }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {projectData.map((project, index) => (
              <tr key={project.id}>
                <th>{index + 1}</th>
                <td>{project.code}</td>
                <td>{project.location}</td>
                <td>{project.date}</td>
                <td>{project.date}</td>
                <td>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  {project.progress}%
                </td>
                <td>
                  <div className="d-flex justify-content-evenly">
                    
                    <button
                      type="button"
                      className="btn btn-danger btn-outline-light"
                      disabled={
                        position !== "Project Manager" && position !== "Admin"
                      }
                      style={{
                        opacity:
                          position !== "Project Manager" && position !== "Admin"
                            ? 0.5
                            : 1,
                        cursor:
                          position !== "Project Manager" && position !== "Admin"
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => handleDelete(project.code)} 
                    >
                      <i className="bi bi-trash3"></i>
                    </button>

              <Link to={`/Project/projectstatus_db?project_code=${project.code}`}>
                    <button
                      type="button"
                      className="btn btn-warning btn-outline-light"
                      disabled={
                        position !== "Project Manager" && position !== "Admin"
                      }
                      style={{
                        opacity:
                          position !== "Project Manager" && position !== "Admin"
                            ? 0.5
                            : 1,
                        cursor:
                          position !== "Project Manager" && position !== "Admin"
                            ? "not-allowed"
                            : "pointer",
                      }}
                  
                    >
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Project;
