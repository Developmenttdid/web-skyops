import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";

function Checklistdb() {
  const [projectData, setProjectData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const name = localStorage.getItem("name");
  const itemsPerPage = 15;
  // state for current modal page
  const [currentModalPage, setCurrentModalPage] = useState(1);
  const totalModalPages = 6; // UAV, Payload, GPS, PPE, Other, Handover
  // state for payload checklist in
  const [payloadData, setPayloadData] = useState([]);
  // state for gps checklist in
  const [gpsData, setGpsData] = useState([]);
  // state for ppe checklist in
  const [ppeData, setPpeData] = useState([]);
  //state for other checklist in
  const [otherData, setOtherData] = useState([]);
  // state for handover checklist
  const [handoverData, setHandoverData] = useState([]);

  const [showOutModal, setShowOutModal] = useState(false);
  const [outModalData, setOutModalData] = useState(null);
  const [outPayloadData, setOutPayloadData] = useState([]);
  const [outGpsData, setOutGpsData] = useState([]);
  const [outPpeData, setOutPpeData] = useState([]);
  const [outOtherData, setOutOtherData] = useState([]);
  const [outHandoverData, setOutHandoverData] = useState([]);
  const [outModalLoading, setOutModalLoading] = useState(false);
  const [currentOutModalPage, setCurrentOutModalPage] = useState(1);

  const handleDownloadOut = async () => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;
      const now = new Date();
      const timestamp = now.toLocaleString();

      doc.setFontSize(18);
      doc.setTextColor(20, 60, 120);
      doc.setFont(undefined, "bold");
      doc.text(
        `Checklist Out Report- ${outModalData?.projectCode}`,
        pageWidth / 2,
        margin,
        { align: "center" }
      );

      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(`Generated on: ${timestamp}`, pageWidth / 2, margin + 30, {
        align: "center",
      });

      let yPosition = margin + 60;

      const loadIcon = async (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 15;
            canvas.height = 15;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 15, 15);
            resolve(canvas);
          };
        });
      };

      const checkIcon = await loadIcon(
        "https://img.icons8.com/fluency/48/ok--v1.png"
      );
      const crossIcon = await loadIcon(
        "https://img.icons8.com/color/48/close-window.png"
      );

      const addNewPageIfNeeded = (spaceNeeded) => {
        if (
          yPosition + spaceNeeded >
          doc.internal.pageSize.getHeight() - margin
        ) {
          doc.addPage();
          yPosition = margin;
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(
            `Checklist Report - ${
              outModalData?.projectCode
            } - Page ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            20,
            { align: "center" }
          );
          yPosition = margin;
        }
      };

      let isFirstSection = true;
      const addSectionHeader = (title) => {
        if (!isFirstSection && yPosition > margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(14);
        doc.setTextColor(20, 60, 120);
        doc.setFont(undefined, "bold");
        doc.text(title, margin, yPosition);
        yPosition += 30;
        doc.setDrawColor(20, 60, 120);
        doc.setLineWidth(1.5);
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
        yPosition += 30;
        isFirstSection = false;
      };

      const addTable = (headers, rows, options = {}) => {
        const { rowHeight = 25, cellPadding = 5 } = options;
        const colWidths = headers.map((h) => h.width);
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        let scale = 1;
        if (tableWidth > contentWidth) {
          scale = contentWidth / tableWidth;
        }
        const scaledWidths = colWidths.map((w) => w * scale);

        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(255, 255, 255);

        let xPos = margin;
        headers.forEach((header, i) => {
          const width = scaledWidths[i];
          doc.setFillColor(20, 60, 120);
          doc.rect(xPos, yPosition, width, rowHeight, "F");
          doc.text(
            header.text,
            xPos + cellPadding,
            yPosition + rowHeight / 2 + 3,
            { maxWidth: width - cellPadding * 2 }
          );
          xPos += width;
        });
        yPosition += rowHeight;

        doc.setFont(undefined, "normal");
        doc.setTextColor(0, 0, 0);

        rows.forEach((row) => {
          let maxLines = 1;
          headers.forEach((header, i) => {
            const text = row[header.key] || "";
            const lines = doc.splitTextToSize(
              text,
              scaledWidths[i] - cellPadding * 2
            );
            maxLines = Math.max(maxLines, lines.length);
          });
          const neededHeight = rowHeight * maxLines;
          addNewPageIfNeeded(neededHeight);

          xPos = margin;
          headers.forEach((header, i) => {
            const width = scaledWidths[i];
            doc.rect(xPos, yPosition, width, neededHeight);
            if (header.key === "status") {
              const iconSize = 12;
              doc.addImage(
                row[header.key] === "checked" ? checkIcon : crossIcon,
                "PNG",
                xPos + width / 2 - iconSize / 2,
                yPosition + neededHeight / 2 - iconSize / 2,
                iconSize,
                iconSize
              );
            } else {
              const lines = doc.splitTextToSize(
                row[header.key] || "",
                width - cellPadding * 2
              );
              doc.text(
                lines,
                xPos + cellPadding,
                yPosition + rowHeight / 2 + 3,
                {
                  maxWidth: width - cellPadding * 2,
                  lineHeightFactor: 1.2,
                }
              );
            }
            xPos += width;
          });
          yPosition += neededHeight;
        });

        yPosition += 15;
      };

      const addImages = async (imageUrls) => {
        const maxImageWidth = 180;
        const imageHeight = 120;
        const imagesPerRow = Math.min(
          2,
          Math.floor(contentWidth / (maxImageWidth + 20))
        );

        for (let i = 0; i < imageUrls.length; i++) {
          if (i % imagesPerRow === 0) {
            addNewPageIfNeeded(imageHeight + 80);
            yPosition = i === 0 ? yPosition : margin + 20;
          }
          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrls[i];
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
            if (img.complete && img.naturalWidth !== 0) {
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              let renderWidth = maxImageWidth;
              let renderHeight = imageHeight;
              if (aspectRatio > 1) {
                renderHeight = maxImageWidth / aspectRatio;
              } else {
                renderWidth = imageHeight * aspectRatio;
              }
              const xPos = margin + (i % imagesPerRow) * (maxImageWidth + 30);
              doc.addImage(
                img,
                "JPEG",
                xPos,
                yPosition,
                renderWidth,
                renderHeight,
                undefined,
                "FAST"
              );
            }
          } catch (error) {
            console.error("Error adding image:", error);
          }
        }
        if (imageUrls.length > 0) {
          yPosition += imageHeight + 50;
        }
      };

      // 1. UAV Data
      if (outModalData?.equipmentChecklists?.length > 0) {
        addSectionHeader("UAV Checklist");
        outModalData.equipmentChecklists.forEach((equipment, eqIndex) => {
          addNewPageIfNeeded(80);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, "bold");
          doc.text(`${equipment.equipmentType}`, margin, yPosition);
          doc.setFont(undefined, "normal");
          doc.text(
            `Checked on: ${equipment.timestamp}`,
            margin,
            yPosition + 20
          );
          yPosition += 40;
          const headers = [
            { text: "Category", key: "category", width: 150 },
            { text: "Item", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];
          const rows = equipment.items.map((item) => ({
            category: item.category,
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));
          addTable(headers, rows, { rowHeight: 30 });
        });
      }

      // 2. Payload Data
      if (outPayloadData.length > 0) {
        addSectionHeader("Payload Checklist");
        outPayloadData.forEach((payload, payloadIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, "bold");
          doc.text(
            `${payload.payloadName} - ${payload.timestamp}`,
            margin,
            yPosition
          );
          yPosition += 25;
          const headers = [
            { text: "Item", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];
          const rows = payload.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));
          addTable(headers, rows);
        });
      }

      // 3. GPS Data
      if (outGpsData.length > 0) {
        addSectionHeader("GPS Checklist");
        outGpsData.forEach((gps, gpsIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, "bold");
          doc.text(`${gps.gpsName} - ${gps.timestamp}`, margin, yPosition);
          yPosition += 25;
          const headers = [
            { text: "Item", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];
          const rows = gps.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));
          addTable(headers, rows);
        });
      }

      // 4. PPE Data
      if (outPpeData.length > 0) {
        addSectionHeader("PPE Checklist");
        outPpeData.forEach((ppe, ppeIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, "bold");
          doc.text(`${ppe.ppeName} - ${ppe.timestamp}`, margin, yPosition);
          yPosition += 25;
          const headers = [
            { text: "PPE Name", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];
          const rows = ppe.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));
          addTable(headers, rows);
        });
      }

      // 5. Other Equipment Data
      if (Object.keys(outOtherData).length > 0) {
        addSectionHeader("Other Equipment Checklist");
        Object.entries(outOtherData).forEach(([equipmentName, items]) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, "bold");
          doc.text(
            `${equipmentName} - ${new Date(
              items[0].timestamp
            ).toLocaleString()}`,
            margin,
            yPosition
          );
          yPosition += 25;
          const headers = [
            { text: "Equipment ID", key: "id", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];
          const rows = items.map((item) => ({
            id: item.equipment_id,
            status: item.item_1 === "true" ? "checked" : "unchecked",
          }));
          addTable(headers, rows);
        });
      }

      // 6. Handover Data with images
      if (outHandoverData.length > 0) {
        addSectionHeader("Handover Details");
        for (const handover of outHandoverData) {
          addNewPageIfNeeded(120);
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(`Handover Details`, margin, yPosition);
          doc.setFont(undefined, "normal");
          doc.text(
            `Completed on: ${new Date(handover.timestamp).toLocaleString()}`,
            margin,
            yPosition + 20
          );
          yPosition += 50;
          const detailsHeaders = [
            { text: "Field", key: "field", width: 150 },
            { text: "Value", key: "value", width: 350 },
          ];
          const detailsRows = [
            { field: "Approver", value: handover.approver },
            { field: "PIC Project", value: handover.pic_project },
            { field: "Notes", value: handover.notes || "-" },
          ];
          addTable(detailsHeaders, detailsRows, { rowHeight: 30 });
          if (handover.evidence) {
            addNewPageIfNeeded(200);
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Handover Evidence:", margin, yPosition);
            yPosition += 30;
            const imageUrls = handover.evidence
              .split(",")
              .map((url) => url.trim());
            await addImages(imageUrls);
          }
          yPosition += 50;
        }
      }

      const formattedDate = now.toISOString().replace(/[:.]/g, "-");
      doc.save(
        `Checklist_OUT_${outModalData?.projectCode}_${formattedDate}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownload = async () => {
    try {
      // Create a new PDF document with better formatting
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;

      // Add project code and timestamp at the top
      const now = new Date();
      const timestamp = now.toLocaleString();

      // Header with better styling
      doc.setFontSize(18);
      doc.setTextColor(20, 60, 120);
      doc.setFont(undefined, "bold");
      doc.text(
        `Checklist In Report- ${modalData?.projectCode}`,
        pageWidth / 2,
        margin,
        { align: "center" }
      );

      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(`Generated on: ${timestamp}`, pageWidth / 2, margin + 30, {
        align: "center",
      });

      let yPosition = margin + 60;

      // Fungsi untuk memuat gambar icon
      const loadIcon = async (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            // Fallback jika gambar gagal dimuat
            const canvas = document.createElement("canvas");
            canvas.width = 15;
            canvas.height = 15;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 15, 15);
            resolve(canvas);
          };
        });
      };

      // Load icon sekali saja di awal
      const checkIcon = await loadIcon(
        "https://img.icons8.com/fluency/48/ok--v1.png"
      );
      const crossIcon = await loadIcon(
        "https://img.icons8.com/color/48/close-window.png"
      );

      // Function to add a new page if needed with more space
      const addNewPageIfNeeded = (spaceNeeded) => {
        if (
          yPosition + spaceNeeded >
          doc.internal.pageSize.getHeight() - margin
        ) {
          doc.addPage();
          yPosition = margin;
          // Add small header on new pages
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(
            `Checklist Report - ${
              modalData?.projectCode
            } - Page ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            20,
            { align: "center" }
          );
          yPosition = margin;
        }
      };

      // Function to add section header with better spacing
      // Modifikasi fungsi addSectionHeader
      // Function to add section header with better spacing
      let isFirstSection = true; // Tambahkan variabel ini di awal fungsi handleDownload

      const addSectionHeader = (title) => {
        // Untuk section selain pertama, buat halaman baru jika tidak di awal halaman
        if (!isFirstSection && yPosition > margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setTextColor(20, 60, 120);
        doc.setFont(undefined, "bold");
        doc.text(title, margin, yPosition);
        yPosition += 30;

        // Add decorative line
        doc.setDrawColor(20, 60, 120);
        doc.setLineWidth(1.5);
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
        yPosition += 30;

        isFirstSection = false; // Setelah section pertama, flag diubah ke false
      };
      // Improved table function with better text wrapping and icons
      const addTable = (headers, rows, options = {}) => {
        const { rowHeight = 25, cellPadding = 5 } = options;

        // 1. Hitung lebar tabel total
        const colWidths = headers.map((h) => h.width);
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);

        // 2. Hitung scaling factor jika perlu
        let scale = 1;
        if (tableWidth > contentWidth) {
          scale = contentWidth / tableWidth;
        }
        const scaledWidths = colWidths.map((w) => w * scale);

        // 3. Render Header
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(255, 255, 255);

        let xPos = margin;
        headers.forEach((header, i) => {
          const width = scaledWidths[i];
          doc.setFillColor(20, 60, 120);
          doc.rect(xPos, yPosition, width, rowHeight, "F");
          doc.text(
            header.text,
            xPos + cellPadding,
            yPosition + rowHeight / 2 + 3,
            { maxWidth: width - cellPadding * 2 }
          );
          xPos += width;
        });
        yPosition += rowHeight;

        // 4. Render Body dengan kontrol presisi
        doc.setFont(undefined, "normal");
        doc.setTextColor(0, 0, 0);

        rows.forEach((row) => {
          // Hitung tinggi baris
          let maxLines = 1;
          headers.forEach((header, i) => {
            const text = row[header.key] || "";
            const lines = doc.splitTextToSize(
              text,
              scaledWidths[i] - cellPadding * 2
            );
            maxLines = Math.max(maxLines, lines.length);
          });
          const neededHeight = rowHeight * maxLines;

          addNewPageIfNeeded(neededHeight);

          // Render setiap sel
          xPos = margin;
          headers.forEach((header, i) => {
            const width = scaledWidths[i];

            // Gambar border sel
            doc.rect(xPos, yPosition, width, neededHeight);

            // Konten sel
            if (header.key === "status") {
              const iconSize = 12;
              doc.addImage(
                row[header.key] === "checked" ? checkIcon : crossIcon,
                "PNG",
                xPos + width / 2 - iconSize / 2,
                yPosition + neededHeight / 2 - iconSize / 2,
                iconSize,
                iconSize
              );
            } else {
              const lines = doc.splitTextToSize(
                row[header.key] || "",
                width - cellPadding * 2
              );
              doc.text(
                lines,
                xPos + cellPadding,
                yPosition + rowHeight / 2 + 3,
                {
                  maxWidth: width - cellPadding * 2,
                  lineHeightFactor: 1.2,
                }
              );
            }

            xPos += width;
          });

          yPosition += neededHeight;
        });

        yPosition += 15; // Spasi setelah tabel
      };

      // Function to add images with proper handling
      // Modifikasi di addImages
      const addImages = async (imageUrls) => {
        const maxImageWidth = 180; // Lebar maksimum
        const imageHeight = 120; // Tinggi tetap
        const imagesPerRow = Math.min(
          2,
          Math.floor(contentWidth / (maxImageWidth + 20))
        );

        for (let i = 0; i < imageUrls.length; i++) {
          if (i % imagesPerRow === 0) {
            addNewPageIfNeeded(imageHeight + 80);
            yPosition = i === 0 ? yPosition : margin + 20;
          }

          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageUrls[i];

            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });

            if (img.complete && img.naturalWidth !== 0) {
              // Hitung aspect ratio yang benar
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              let renderWidth = maxImageWidth;
              let renderHeight = imageHeight;

              // Sesuaikan ukuran tetap mempertahankan aspect ratio
              if (aspectRatio > 1) {
                renderHeight = maxImageWidth / aspectRatio;
              } else {
                renderWidth = imageHeight * aspectRatio;
              }

              const xPos = margin + (i % imagesPerRow) * (maxImageWidth + 30);

              doc.addImage(
                img,
                "JPEG",
                xPos,
                yPosition,
                renderWidth,
                renderHeight,
                undefined,
                "FAST"
              );

              // ... kode tambahan untuk label
            }
          } catch (error) {
            console.error("Error adding image:", error);
            // ... fallback code
          }
        }

        if (imageUrls.length > 0) {
          yPosition += imageHeight + 50;
        }
      };

      // 1. UAV Data with better formatting
      if (modalData?.equipmentChecklists?.length > 0) {
        addSectionHeader("UAV Checklist");

        modalData.equipmentChecklists.forEach((equipment, eqIndex) => {
          addNewPageIfNeeded(80);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.setFont(undefined, "bold");
          doc.text(`${equipment.equipmentType}`, margin, yPosition);
          doc.setFont(undefined, "normal");
          doc.text(
            `Checked on: ${equipment.timestamp}`,
            margin,
            yPosition + 20
          );
          yPosition += 40;

          // Prepare table data with adjusted column widths
          const headers = [
            { text: "Category", key: "category", width: 150 }, // Wider category column
            { text: "Item", key: "item", width: 350 }, // Wider item column
            { text: "Status", key: "status", width: 80 },
          ];

          const rows = equipment.items.map((item) => ({
            category: item.category,
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));

          addTable(headers, rows, { rowHeight: 30 }); // Taller rows for better readability
        });
      }

      // 2. Payload Data
      if (payloadData.length > 0) {
        addSectionHeader("Payload Checklist");

        payloadData.forEach((payload, payloadIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.setFont(undefined, "bold");
          doc.text(
            `${payload.payloadName} - ${payload.timestamp}`,
            margin,
            yPosition
          );
          yPosition += 25;

          const headers = [
            { text: "Item", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];

          const rows = payload.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));

          addTable(headers, rows);
        });
      }

      // 3. GPS Data
      if (gpsData.length > 0) {
        addSectionHeader("GPS Checklist");

        gpsData.forEach((gps, gpsIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.setFont(undefined, "bold");
          doc.text(`${gps.gpsName} - ${gps.timestamp}`, margin, yPosition);
          yPosition += 25;

          const headers = [
            { text: "Item", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];

          const rows = gps.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));

          addTable(headers, rows);
        });
      }

      // 4. PPE Data
      if (ppeData.length > 0) {
        addSectionHeader("PPE Checklist");

        ppeData.forEach((ppe, ppeIndex) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.setFont(undefined, "bold");
          doc.text(`${ppe.ppeName} - ${ppe.timestamp}`, margin, yPosition);
          yPosition += 25;

          const headers = [
            { text: "PPE Name", key: "item", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];

          const rows = ppe.items.map((item) => ({
            item: item.name,
            status: item.checked ? "checked" : "unchecked",
          }));

          addTable(headers, rows);
        });
      }

      // 5. Other Equipment Data
      if (Object.keys(otherData).length > 0) {
        addSectionHeader("Other Equipment Checklist");

        Object.entries(otherData).forEach(([equipmentName, items]) => {
          addNewPageIfNeeded(50);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.setFont(undefined, "bold");
          doc.text(
            `${equipmentName} - ${new Date(
              items[0].timestamp
            ).toLocaleString()}`,
            margin,
            yPosition
          );
          yPosition += 25;

          const headers = [
            { text: "Equipment ID", key: "id", width: 350 },
            { text: "Status", key: "status", width: 80 },
          ];

          const rows = items.map((item) => ({
            id: item.equipment_id,
            status: item.item_1 === "true" ? "checked" : "unchecked",
          }));

          addTable(headers, rows);
        });
      }

      // 6. Handover Data with images
      if (handoverData.length > 0) {
        addSectionHeader("Handover Details");

        for (const handover of handoverData) {
          addNewPageIfNeeded(120);
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.setTextColor(0, 0, 0); // Pastikan warna hitam
          doc.text(`Handover Details`, margin, yPosition);
          doc.setFont(undefined, "normal");
          doc.text(
            `Completed on: ${new Date(handover.timestamp).toLocaleString()}`,
            margin,
            yPosition + 20
          );
          yPosition += 50;

          // Handover details table
          const detailsHeaders = [
            { text: "Field", key: "field", width: 150 },
            { text: "Value", key: "value", width: 350 },
          ];

          const detailsRows = [
            { field: "Approver", value: handover.approver },
            { field: "PIC Project", value: handover.pic_project },
            { field: "Notes", value: handover.notes || "-" },
          ];

          addTable(detailsHeaders, detailsRows, { rowHeight: 30 });

          // Add evidence images if they exist
          if (handover.evidence) {
            addNewPageIfNeeded(200);
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Handover Evidence:", margin, yPosition);
            yPosition += 30;

            const imageUrls = handover.evidence
              .split(",")
              .map((url) => url.trim());
            await addImages(imageUrls);
          }

          // Extra space between handover records
          yPosition += 50;
        }
      }

      // Final save with timestamp
      const formattedDate = now.toISOString().replace(/[:.]/g, "-");
      doc.save(`Checklist_${modalData?.projectCode}_${formattedDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Step 1: Check user role
        const usersResponse = await fetch("http://103.163.184.111:3000/users");
        const usersData = await usersResponse.json();

        const currentUser = usersData.find((user) => user.name === name);
        const isAdmin = currentUser?.position === "Admin";

        // Step 2: Fetch personnel data
        const personnelResponse = await fetch(
          "http://103.163.184.111:3000/personnel"
        );
        const personnelData = await personnelResponse.json();

        // Step 3: Fetch all necessary data in parallel
        const [outChecklists, inChecklists] = await Promise.all([
          fetch("http://103.163.184.111:3000/uav_database").then((res) =>
            res.json()
          ),
          fetch("http://103.163.184.111:3000/uav_database_in").then((res) =>
            res.json()
          ),
        ]);

        // Get unique project codes based on role
        let projects = [];
        if (isAdmin) {
          projects = [
            ...new Set(personnelData.map((person) => person.project_code)),
          ];
        } else {
          projects = [
            ...new Set(
              personnelData
                .filter((person) => person.personnel_name === name)
                .map((person) => person.project_code)
            ),
          ];
        }

        // Prepare final data with checklist status and timestamps
        const processedData = projects.map((code, index) => {
          // Find checklist out data for this project
          const outChecklist = outChecklists.find(
            (item) => item.project_code === code
          );
          const hasOutChecklist = !!outChecklist;
          const outTimestamp = outChecklist?.timestamp
            ? new Date(outChecklist.timestamp).toLocaleDateString()
            : "-";

          // Find checklist in data for this project
          const inChecklist = inChecklists.find(
            (item) => item.project_code === code
          );
          const hasInChecklist = !!inChecklist;
          const inTimestamp = inChecklist?.timestamp
            ? new Date(inChecklist.timestamp).toLocaleDateString()
            : "-";

          return {
            id: index + 1,
            code,
            hasOutChecklist,
            outTimestamp,
            hasInChecklist,
            inTimestamp,
            inChecklistData: inChecklist, // Store the full checklist data for modal
          };
        });

        setProjectData(processedData);
        setFilteredData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchData();
    }
  }, [name]);

  // Handle search
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(projectData);
      setCurrentPage(1);
    } else {
      const filtered = projectData.filter(
        (project) =>
          project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.outTimestamp
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.inTimestamp.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, projectData]);

  const handleShowCheckOutDetails = async (project) => {
    if (!project.hasOutChecklist) return;
    try {
      setOutModalLoading(true);
      setShowOutModal(true);

      const [
        checklistNamesData,
        allOutChecklists,
        payloadChecklists,
        payloadNamesData,
        gpsChecklists,
        gpsNamesData,
        ppeChecklists,
        ppeNamesData,
        otherChecklists,
        handoverChecklists,
      ] = await Promise.all([
        fetch("http://103.163.184.111:3000/inventory_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/uav_database").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/payload_database").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/payload_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/gps_database").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/gps_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/ppe_database").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/ppe_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/other_database").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/handover_database").then((res) =>
          res.json()
        ),
      ]);

      // UAV
      const projectChecklists = allOutChecklists.filter(
        (item) => item.project_code === project.code
      );
      const equipmentChecklists = [];
      for (const checklist of projectChecklists) {
        const equipmentType = checklist.equipment_uav;
        const equipmentNames = checklistNamesData.find(
          (item) => item.equipment_uav === equipmentType
        );
        if (!equipmentNames) continue;
        const itemsToDisplay = [];
        for (let i = 1; i <= 20; i++) {
          const itemKey = `uav_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "UAV",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        for (let i = 1; i <= 10; i++) {
          const itemKey = `power_system_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "Power System",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        for (let i = 1; i <= 10; i++) {
          const itemKey = `gcs_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "GCS",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        for (let i = 1; i <= 10; i++) {
          const itemKey = `standard_acc_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "Standard Accessories",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        equipmentChecklists.push({
          equipmentType,
          timestamp: new Date(checklist.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Payload
      const projectPayloads = payloadChecklists.filter(
        (item) => item.project_code === project.code
      );
      const payloadChecklistData = [];
      for (const payload of projectPayloads) {
        const payloadName = payload.payload_name;
        const payloadItems = payloadNamesData.find(
          (item) => item.payload_name === payloadName
        );
        if (!payloadItems) continue;
        const itemsToDisplay = [];
        for (let i = 1; i <= 26; i++) {
          const itemKey = `item_${i}`;
          if (payloadItems[itemKey] && payload[itemKey] !== null) {
            itemsToDisplay.push({
              name: payloadItems[itemKey],
              checked: payload[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        payloadChecklistData.push({
          payloadName,
          timestamp: new Date(payload.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // GPS
      const projectGps = gpsChecklists.filter(
        (item) => item.project_code === project.code
      );
      const gpsChecklistData = [];
      for (const gps of projectGps) {
        const gpsName = gps.gps_name;
        const gpsItems = gpsNamesData.find((item) => item.gps_name === gpsName);
        if (!gpsItems) continue;
        const itemsToDisplay = [];
        for (let i = 1; i <= 11; i++) {
          const itemKey = `item_${i}`;
          if (gpsItems[itemKey] && gps[itemKey] !== null) {
            itemsToDisplay.push({
              name: gpsItems[itemKey],
              checked: gps[itemKey] === "true",
              key: itemKey,
            });
          }
        }
        gpsChecklistData.push({
          gpsName,
          timestamp: new Date(gps.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // PPE
      const projectPpe = ppeChecklists.filter(
        (item) => item.project_code === project.code
      );
      const ppeChecklistData = [];
      for (const ppe of projectPpe) {
        const ppeName = ppe.ppe_name;
        const ppeItems = ppeNamesData.find((item) => item.ppe_name === ppeName);
        if (!ppeItems) continue;
        const itemsToDisplay = [];
        const itemKey = "item_1";
        if (ppeItems[itemKey] && ppe[itemKey] !== null) {
          itemsToDisplay.push({
            name: ppeName,
            checked: ppe[itemKey] === "true",
            key: itemKey,
          });
        }
        ppeChecklistData.push({
          ppeName,
          timestamp: new Date(ppe.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Other
      const projectOther = otherChecklists.filter(
        (item) => item.project_code === project.code
      );
      const groupedOtherData = {};
      projectOther.forEach((item) => {
        if (!groupedOtherData[item.other_equipment]) {
          groupedOtherData[item.other_equipment] = [];
        }
        groupedOtherData[item.other_equipment].push(item);
      });

      // Handover
      const projectHandover = handoverChecklists.filter(
        (item) => item.project_code === project.code
      );

      setOutHandoverData(projectHandover);
      setOutOtherData(groupedOtherData);
      setOutPayloadData(payloadChecklistData);
      setOutGpsData(gpsChecklistData);
      setOutPpeData(ppeChecklistData);
      setOutModalData({
        projectCode: project.code,
        equipmentChecklists,
      });
    } catch (error) {
      console.error("Error loading checklist OUT details:", error);
    } finally {
      setOutModalLoading(false);
    }
  };

  // Handle modal open for check in details
  const handleShowCheckInDetails = async (project) => {
    if (!project.hasInChecklist) return;

    try {
      setModalLoading(true);
      setShowModal(true);

      // Fetch all necessary data
      const [
        checklistNamesData,
        allInChecklists,
        payloadChecklists,
        payloadNamesData,
        gpsChecklists,
        gpsNamesData,
        ppeChecklists,
        ppeNamesData,
        otherChecklists,
        handoverChecklists,
      ] = await Promise.all([
        fetch("http://103.163.184.111:3000/inventory_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/uav_database_in").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/payload_database_in").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/payload_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/gps_database_in").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/gps_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/ppe_database_in").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/ppe_checklist").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/other_database_in").then((res) =>
          res.json()
        ),
        fetch("http://103.163.184.111:3000/handover_database").then((res) =>
          res.json()
        ),
      ]);

      // Filter all checklists for this project code
      const projectChecklists = allInChecklists.filter(
        (item) => item.project_code === project.code
      );

      // Prepare data for each equipment type
      const equipmentChecklists = [];

      for (const checklist of projectChecklists) {
        const equipmentType = checklist.equipment_uav;
        const equipmentNames = checklistNamesData.find(
          (item) => item.equipment_uav === equipmentType
        );

        if (!equipmentNames) {
          console.warn(
            `No checklist names found for equipment type: ${equipmentType}`
          );
          continue;
        }

        // Prepare checklist items for this equipment
        const itemsToDisplay = [];

        // Process UAV items
        for (let i = 1; i <= 20; i++) {
          const itemKey = `uav_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "UAV",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        // Process Power System items
        for (let i = 1; i <= 10; i++) {
          const itemKey = `power_system_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "Power System",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        // Process GCS items
        for (let i = 1; i <= 10; i++) {
          const itemKey = `gcs_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "GCS",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        // Process Standard Accessories items
        for (let i = 1; i <= 10; i++) {
          const itemKey = `standard_acc_${i}`;
          if (equipmentNames[itemKey] && checklist[itemKey] !== null) {
            itemsToDisplay.push({
              category: "Standard Accessories",
              name: equipmentNames[itemKey],
              checked: checklist[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        equipmentChecklists.push({
          equipmentType,
          timestamp: new Date(checklist.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Filter payload checklists for this project code
      const projectPayloads = payloadChecklists.filter(
        (item) => item.project_code === project.code
      );

      // Prepare payload data
      const payloadChecklistData = [];

      for (const payload of projectPayloads) {
        const payloadName = payload.payload_name;
        const payloadItems = payloadNamesData.find(
          (item) => item.payload_name === payloadName
        );

        if (!payloadItems) continue;

        const itemsToDisplay = [];

        // Process payload items (1-26)
        for (let i = 1; i <= 26; i++) {
          const itemKey = `item_${i}`;
          const itemNameKey = `item_${i}`;

          if (payloadItems[itemNameKey] && payload[itemKey] !== null) {
            itemsToDisplay.push({
              name: payloadItems[itemNameKey],
              checked: payload[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        payloadChecklistData.push({
          payloadName,
          timestamp: new Date(payload.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Filter GPS checklists for this project code
      const projectGps = gpsChecklists.filter(
        (item) => item.project_code === project.code
      );

      // Prepare GPS data
      const gpsChecklistData = [];

      for (const gps of projectGps) {
        const gpsName = gps.gps_name;
        const gpsItems = gpsNamesData.find((item) => item.gps_name === gpsName);

        if (!gpsItems) continue;

        const itemsToDisplay = [];

        // Process GPS items (1-11)
        for (let i = 1; i <= 11; i++) {
          const itemKey = `item_${i}`;
          const itemNameKey = `item_${i}`;

          if (gpsItems[itemNameKey] && gps[itemKey] !== null) {
            itemsToDisplay.push({
              name: gpsItems[itemNameKey],
              checked: gps[itemKey] === "true",
              key: itemKey,
            });
          }
        }

        gpsChecklistData.push({
          gpsName,
          timestamp: new Date(gps.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Filter PPE checklists for this project code
      const projectPpe = ppeChecklists.filter(
        (item) => item.project_code === project.code
      );

      // Prepare PPE data
      const ppeChecklistData = [];

      for (const ppe of projectPpe) {
        const ppeName = ppe.ppe_name;
        const ppeItems = ppeNamesData.find((item) => item.ppe_name === ppeName);

        if (!ppeItems) continue;

        const itemsToDisplay = [];

        // Process PPE items (only item_1 in this case)
        const itemKey = "item_1";
        const itemNameKey = "item_1";

        if (ppeItems[itemNameKey] && ppe[itemKey] !== null) {
          itemsToDisplay.push({
            name: ppeName, // Using ppe_name as the item name
            checked: ppe[itemKey] === "true",
            key: itemKey,
          });
        }

        ppeChecklistData.push({
          ppeName,
          timestamp: new Date(ppe.timestamp).toLocaleString(),
          items: itemsToDisplay,
        });
      }

      // Process other equipment data
      const projectOther = otherChecklists.filter(
        (item) => item.project_code === project.code
      );

      // Group by other_equipment
      const groupedOtherData = {};
      projectOther.forEach((item) => {
        if (!groupedOtherData[item.other_equipment]) {
          groupedOtherData[item.other_equipment] = [];
        }
        groupedOtherData[item.other_equipment].push(item);
      });

      // Filter handover data for this project code
      const projectHandover = handoverChecklists.filter(
        (item) => item.project_code === project.code
      );

      setHandoverData(projectHandover);
      setOtherData(groupedOtherData);
      setPayloadData(payloadChecklistData);
      setGpsData(gpsChecklistData);
      setPpeData(ppeChecklistData);
      setModalData({
        projectCode: project.code,
        equipmentChecklists,
      });
    } catch (error) {
      console.error("Error loading checklist details:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // Modify the modal body content to include conditional rendering
  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* UAV Page*/}
        {currentModalPage === 1 && (
          <>
            {modalData?.equipmentChecklists?.map((equipment, eqIndex) => (
              <div key={`equipment-${eqIndex}`} className="mb-4">
                <h5 className="mb-3">
                  {equipment.equipmentType}
                  <small className="text-muted ms-2">
                    {equipment.timestamp}
                  </small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "30%" }}>Category</th>
                        <th style={{ width: "50%" }}>Item</th>
                        <th style={{ width: "20%" }} className="text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.items.map((item, index) => (
                        <tr key={`${item.key}-${index}`}>
                          <td>{item.category}</td>
                          <td>{item.name}</td>
                          <td className="text-center">
                            {item.checked ? (
                              <i
                                className="bi bi-check-circle-fill text-success"
                                title="Checked"
                              ></i>
                            ) : (
                              <i
                                className="bi bi-x-circle-fill text-danger"
                                title="Not Checked"
                              ></i>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Payload Page */}
        {currentModalPage === 2 && (
          <>
            {payloadData.length > 0 ? (
              payloadData.map((payload, payloadIndex) => (
                <div key={`payload-${payloadIndex}`} className="mb-4">
                  <h5 className="mb-3">
                    {payload.payloadName}
                    <small className="text-muted ms-2">
                      {payload.timestamp}
                    </small>
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "80%" }}>Item</th>
                          <th style={{ width: "20%" }} className="text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payload.items.map((item, index) => (
                          <tr key={`${item.key}-${index}`}>
                            <td>{item.name}</td>
                            <td className="text-center">
                              {item.checked ? (
                                <i
                                  className="bi bi-check-circle-fill text-success"
                                  title="Checked"
                                ></i>
                              ) : (
                                <i
                                  className="bi bi-x-circle-fill text-danger"
                                  title="Not Checked"
                                ></i>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-camera fs-1 text-muted mb-3"></i>
                <h5>No Payload Data Available</h5>
                <p className="text-muted">
                  No payload checklist found for this project
                </p>
              </div>
            )}
          </>
        )}

        {/* GPS Page */}
        {currentModalPage === 3 && (
          <>
            {gpsData.length > 0 ? (
              gpsData.map((gps, gpsIndex) => (
                <div key={`gps-${gpsIndex}`} className="mb-4">
                  <h5 className="mb-3">
                    {gps.gpsName}
                    <small className="text-muted ms-2">{gps.timestamp}</small>
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "80%" }}>Item</th>
                          <th style={{ width: "20%" }} className="text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gps.items.map((item, index) => (
                          <tr key={`${item.key}-${index}`}>
                            <td>{item.name}</td>
                            <td className="text-center">
                              {item.checked ? (
                                <i
                                  className="bi bi-check-circle-fill text-success"
                                  title="Checked"
                                ></i>
                              ) : (
                                <i
                                  className="bi bi-x-circle-fill text-danger"
                                  title="Not Checked"
                                ></i>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-geo-alt fs-1 text-muted mb-3"></i>
                <h5>No GPS Data Available</h5>
                <p className="text-muted">
                  No GPS checklist found for this project
                </p>
              </div>
            )}
          </>
        )}

        {/* PPE Page */}
        {currentModalPage === 4 && (
          <>
            {ppeData.length > 0 ? (
              <div className="mb-4">
                <h5 className="mb-3">
                  PPE Items
                  <small className="text-muted ms-2">
                    {ppeData.length > 0 && ppeData[0].timestamp}
                  </small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "80%" }}>PPE Name</th>
                        <th style={{ width: "20%" }} className="text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ppeData.map((ppe, ppeIndex) =>
                        ppe.items.map((item, index) => (
                          <tr key={`${ppeIndex}-${index}`}>
                            <td>{item.name}</td>
                            <td className="text-center">
                              {item.checked ? (
                                <i
                                  className="bi bi-check-circle-fill text-success"
                                  title="Checked"
                                ></i>
                              ) : (
                                <i
                                  className="bi bi-x-circle-fill text-danger"
                                  title="Not Checked"
                                ></i>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-shield fs-1 text-muted mb-3"></i>
                <h5>No PPE Data Available</h5>
                <p className="text-muted">
                  No PPE checklist found for this project
                </p>
              </div>
            )}
          </>
        )}

        {/* other page */}
        {currentModalPage === 5 && (
          <>
            {Object.keys(otherData).length > 0 ? (
              Object.entries(otherData).map(([equipmentName, items]) => (
                <div key={equipmentName} className="mb-4">
                  <h5 className="mb-3">
                    {equipmentName}
                    <small className="text-muted ms-2">
                      {items.length > 0 &&
                        new Date(items[0].timestamp).toLocaleString()}
                    </small>
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "80%" }}>Equipment ID</th>
                          <th style={{ width: "20%" }} className="text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={`${equipmentName}-${index}`}>
                            <td>{item.equipment_id}</td>
                            <td className="text-center">
                              {item.item_1 === "true" ? (
                                <i
                                  className="bi bi-check-circle-fill text-success"
                                  title="Checked"
                                ></i>
                              ) : (
                                <i
                                  className="bi bi-x-circle-fill text-danger"
                                  title="Not Checked"
                                ></i>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-tools fs-1 text-muted mb-3"></i>
                <h5>No Other Equipment Data Available</h5>
                <p className="text-muted">
                  No other equipment checklist found for this project
                </p>
              </div>
            )}
          </>
        )}

        {/* Handover Page */}
        {currentModalPage === 6 && (
          <>
            {handoverData.length > 0 ? (
              handoverData.map((handover, index) => (
                <div key={`handover-${index}`} className="mb-4">
                  <h5 className="mb-3">
                    Handover Details
                    <small className="text-muted ms-2">
                      {new Date(handover.timestamp).toLocaleString()}
                    </small>
                  </h5>

                  <div className="table-responsive mb-4">
                    <table className="table table-bordered table-sm">
                      <tbody>
                        <tr>
                          <th style={{ width: "30%" }}>Approver</th>
                          <td>{handover.approver}</td>
                        </tr>
                        <tr>
                          <th>PIC Project</th>
                          <td>{handover.pic_project}</td>
                        </tr>
                        <tr>
                          <th>Notes</th>
                          <td>{handover.notes || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {handover.evidence && (
                    <div className="evidence-section">
                      <h6 className="mb-3">Evidence:</h6>
                      <div className="row">
                        {handover.evidence
                          .split(",")
                          .map((imageUrl, imgIndex) => (
                            <div
                              key={`evidence-${imgIndex}`}
                              className="col-md-4 mb-3"
                            >
                              <div className="card h-100">
                                <img
                                  src={imageUrl.trim()}
                                  className="card-img-top img-fluid"
                                  alt={`Evidence ${imgIndex + 1}`}
                                  style={{
                                    maxHeight: "200px",
                                    objectFit: "contain",
                                  }}
                                />
                                <div className="card-body p-2 text-center">
                                  <a
                                    href={imageUrl.trim()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-primary"
                                  >
                                    View Full Size
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-clipboard-check fs-1 text-muted mb-3"></i>
                <h5>No Handover Data Available</h5>
                <p className="text-muted">
                  No handover checklist found for this project
                </p>
              </div>
            )}
            {handoverData.length > 0 && (
              <div className="text-center mt-3">
                <button className="btn btn-success" onClick={handleDownload}>
                  <i className="bi bi-download me-2"></i>
                  Download PDF
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container-fluid">
      <h3 className="mt-3 ms-2">Checklist Database</h3>

      {/* Search Bar */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-primary text-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Project Code or Date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <table
            className="table text-center table-bordered"
            style={{ borderColor: "#143893" }}
          >
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
                  style={{
                    width: "20%",
                    backgroundColor: "#143893",
                    color: "#CCE6FF",
                  }}
                >
                  Project Code
                </th>
                <th
                  scope="col"
                  style={{
                    width: "15%",
                    backgroundColor: "#143893",
                    color: "#CCE6FF",
                  }}
                >
                  Check Out Date
                </th>
                <th
                  scope="col"
                  style={{
                    width: "10%",
                    backgroundColor: "#143893",
                    color: "#CCE6FF",
                  }}
                >
                  Check Out
                </th>
                <th
                  scope="col"
                  style={{
                    width: "15%",
                    backgroundColor: "#143893",
                    color: "#CCE6FF",
                  }}
                >
                  Check In Date
                </th>
                <th
                  scope="col"
                  style={{
                    width: "10%",
                    backgroundColor: "#143893",
                    color: "#CCE6FF",
                  }}
                >
                  Check In
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((project) => (
                  <tr key={project.id}>
                    <th scope="row">{project.id}</th>
                    <td>{project.code}</td>
                    <td>{project.outTimestamp}</td>
                    <td>
                      {project.hasOutChecklist ? (
                        <button
                          type="button"
                          className="btn btn-outline-warning btn-sm rounded-circle"
                          title="View Checklist Out Details"
                          onClick={() => handleShowCheckOutDetails(project)}
                        >
                          {/* <img
        width="32"
        height="32"
        src="https://img.icons8.com/external-anggara-blue-anggara-putra/32/external-eye-basic-user-interface-anggara-blue-anggara-putra.png"
        alt="external-eye-basic-user-interface-anggara-blue-anggara-putra"
      /> */}
                          <img
                            width="25"
                            height="25"
                            src="https://img.icons8.com/sf-regular-filled/48/FAB005/visible.png"
                            alt="visible"
                          />
                        </button>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{project.inTimestamp}</td>
                    <td>
                      {project.hasInChecklist ? (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-circle"
                          title="View Checklist In Details"
                          onClick={() => handleShowCheckInDetails(project)}
                        >
                          {/* <i className="bi bi-eye-fill"></i> */}
                          {/* <img width="20" height="20" src="https://img.icons8.com/officel/80/ophthalmology.png" alt="ophthalmology"/> */}
                          {/* <img width="30" height="30" src="https://img.icons8.com/external-kmg-design-glyph-kmg-design/32/external-eye-marketing-and-seo-kmg-design-glyph-kmg-design.png" alt="external-eye-marketing-and-seo-kmg-design-glyph-kmg-design"/> */}
                          {/* <img width="30" height="30" src="https://img.icons8.com/external-vectorslab-flat-vectorslab/50/external-Eye-start-up-vectorslab-flat-vectorslab.png" alt="external-Eye-start-up-vectorslab-flat-vectorslab"/> */}
                          {/* <img
                            width="30"
                            height="30"
                            src="https://img.icons8.com/external-soft-fill-juicy-fish/50/external-eye-essentials-soft-fill-soft-fill-juicy-fish.png"
                            alt="external-eye-essentials-soft-fill-soft-fill-juicy-fish"
                          /> */}
                          <img
                            width="25"
                            height="25"
                            src="https://img.icons8.com/sf-regular-filled/48/228BE6/visible.png"
                            alt="visible"
                          />
                        </button>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Checklist In Details Modal */}
          <div
            className={`modal fade ${showModal ? "show" : ""}`}
            style={{ display: showModal ? "block" : "none" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    Checklist In Details - {modalData?.projectCode}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowModal(false);
                      setCurrentModalPage(1); // Reset to first page when closing
                    }}
                  ></button>
                </div>
                <div className="modal-body">{renderModalContent()}</div>
                <div className="modal-footer justify-content-center">
                  {/* Navigation Pills in Footer */}
                  <ul className="nav nav-pills">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 1 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(1)}
                      >
                        <img
                          width="20"
                          height="20"
                          src="https://img.icons8.com/avantgarde/100/drone-bottom-view.png"
                          alt="drone-bottom-view"
                        />{" "}
                        UAV
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 2 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(2)}
                      >
                        <i className="bi bi-camera me-1"></i> Payload
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 3 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(3)}
                      >
                        <i className="bi bi-geo-alt me-1"></i> GPS
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 4 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(4)}
                      >
                        <i className="bi bi-shield me-1"></i> PPE
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 5 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(5)}
                      >
                        <i className="bi bi-tools me-1"></i> Other
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentModalPage === 6 ? "active" : ""
                        }`}
                        onClick={() => setCurrentModalPage(6)}
                      >
                        <i className="bi bi-clipboard-check me-1"></i> Handover
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {showModal && <div className="modal-backdrop fade show"></div>}

          {/* Checklist OUT Details Modal */}
          <div
            className={`modal fade ${showOutModal ? "show" : ""}`}
            style={{ display: showOutModal ? "block" : "none" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header bg-warning text-white">
                  <h5 className="modal-title">
                    Checklist Out Details - {outModalData?.projectCode}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowOutModal(false);
                      setCurrentOutModalPage(1);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {outModalLoading ? (
                    <div className="text-center py-4">
                      <div
                        className="spinner-border text-warning"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* UAV Page */}
                      {currentOutModalPage === 1 && (
                        <>
                          {outModalData?.equipmentChecklists?.map(
                            (equipment, eqIndex) => (
                              <div
                                key={`equipment-out-${eqIndex}`}
                                className="mb-4"
                              >
                                <h5 className="mb-3">
                                  {equipment.equipmentType}
                                  <small className="text-muted ms-2">
                                    {equipment.timestamp}
                                  </small>
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "30%" }}>
                                          Category
                                        </th>
                                        <th style={{ width: "50%" }}>Item</th>
                                        <th
                                          style={{ width: "20%" }}
                                          className="text-center"
                                        >
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {equipment.items.map((item, index) => (
                                        <tr key={`${item.key}-${index}`}>
                                          <td>{item.category}</td>
                                          <td>{item.name}</td>
                                          <td className="text-center">
                                            {item.checked ? (
                                              <i
                                                className="bi bi-check-circle-fill text-success"
                                                title="Checked"
                                              ></i>
                                            ) : (
                                              <i
                                                className="bi bi-x-circle-fill text-danger"
                                                title="Not Checked"
                                              ></i>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          )}
                        </>
                      )}

                      {/* Payload Page */}
                      {currentOutModalPage === 2 && (
                        <>
                          {outPayloadData.length > 0 ? (
                            outPayloadData.map((payload, payloadIndex) => (
                              <div
                                key={`payload-out-${payloadIndex}`}
                                className="mb-4"
                              >
                                <h5 className="mb-3">
                                  {payload.payloadName}
                                  <small className="text-muted ms-2">
                                    {payload.timestamp}
                                  </small>
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "80%" }}>Item</th>
                                        <th
                                          style={{ width: "20%" }}
                                          className="text-center"
                                        >
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {payload.items.map((item, index) => (
                                        <tr key={`${item.key}-${index}`}>
                                          <td>{item.name}</td>
                                          <td className="text-center">
                                            {item.checked ? (
                                              <i
                                                className="bi bi-check-circle-fill text-success"
                                                title="Checked"
                                              ></i>
                                            ) : (
                                              <i
                                                className="bi bi-x-circle-fill text-danger"
                                                title="Not Checked"
                                              ></i>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-camera fs-1 text-muted mb-3"></i>
                              <h5>No Payload Data Available</h5>
                              <p className="text-muted">
                                No payload checklist found for this project
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* GPS Page */}
                      {currentOutModalPage === 3 && (
                        <>
                          {outGpsData.length > 0 ? (
                            outGpsData.map((gps, gpsIndex) => (
                              <div key={`gps-out-${gpsIndex}`} className="mb-4">
                                <h5 className="mb-3">
                                  {gps.gpsName}
                                  <small className="text-muted ms-2">
                                    {gps.timestamp}
                                  </small>
                                </h5>
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "80%" }}>Item</th>
                                        <th
                                          style={{ width: "20%" }}
                                          className="text-center"
                                        >
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gps.items.map((item, index) => (
                                        <tr key={`${item.key}-${index}`}>
                                          <td>{item.name}</td>
                                          <td className="text-center">
                                            {item.checked ? (
                                              <i
                                                className="bi bi-check-circle-fill text-success"
                                                title="Checked"
                                              ></i>
                                            ) : (
                                              <i
                                                className="bi bi-x-circle-fill text-danger"
                                                title="Not Checked"
                                              ></i>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-geo-alt fs-1 text-muted mb-3"></i>
                              <h5>No GPS Data Available</h5>
                              <p className="text-muted">
                                No GPS checklist found for this project
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* PPE Page */}
                      {currentOutModalPage === 4 && (
                        <>
                          {outPpeData.length > 0 ? (
                            <div className="mb-4">
                              <h5 className="mb-3">
                                PPE Items
                                <small className="text-muted ms-2">
                                  {outPpeData.length > 0 &&
                                    outPpeData[0].timestamp}
                                </small>
                              </h5>
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: "80%" }}>PPE Name</th>
                                      <th
                                        style={{ width: "20%" }}
                                        className="text-center"
                                      >
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {outPpeData.map((ppe, ppeIndex) =>
                                      ppe.items.map((item, index) => (
                                        <tr key={`${ppeIndex}-${index}`}>
                                          <td>{item.name}</td>
                                          <td className="text-center">
                                            {item.checked ? (
                                              <i
                                                className="bi bi-check-circle-fill text-success"
                                                title="Checked"
                                              ></i>
                                            ) : (
                                              <i
                                                className="bi bi-x-circle-fill text-danger"
                                                title="Not Checked"
                                              ></i>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-shield fs-1 text-muted mb-3"></i>
                              <h5>No PPE Data Available</h5>
                              <p className="text-muted">
                                No PPE checklist found for this project
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Other Page */}
                      {currentOutModalPage === 5 && (
                        <>
                          {Object.keys(outOtherData).length > 0 ? (
                            Object.entries(outOtherData).map(
                              ([equipmentName, items]) => (
                                <div key={equipmentName} className="mb-4">
                                  <h5 className="mb-3">
                                    {equipmentName}
                                    <small className="text-muted ms-2">
                                      {items.length > 0 &&
                                        new Date(
                                          items[0].timestamp
                                        ).toLocaleString()}
                                    </small>
                                  </h5>
                                  <div className="table-responsive">
                                    <table className="table table-bordered table-sm">
                                      <thead className="table-light">
                                        <tr>
                                          <th style={{ width: "80%" }}>
                                            Equipment ID
                                          </th>
                                          <th
                                            style={{ width: "20%" }}
                                            className="text-center"
                                          >
                                            Status
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {items.map((item, index) => (
                                          <tr key={`${equipmentName}-${index}`}>
                                            <td>{item.equipment_id}</td>
                                            <td className="text-center">
                                              {item.item_1 === "true" ? (
                                                <i
                                                  className="bi bi-check-circle-fill text-success"
                                                  title="Checked"
                                                ></i>
                                              ) : (
                                                <i
                                                  className="bi bi-x-circle-fill text-danger"
                                                  title="Not Checked"
                                                ></i>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-tools fs-1 text-muted mb-3"></i>
                              <h5>No Other Equipment Data Available</h5>
                              <p className="text-muted">
                                No other equipment checklist found for this
                                project
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Handover Page */}
                      {currentOutModalPage === 6 && (
                        <>
                          {outHandoverData.length > 0 ? (
                            outHandoverData.map((handover, index) => (
                              <div
                                key={`handover-out-${index}`}
                                className="mb-4"
                              >
                                <h5 className="mb-3">
                                  Handover Details
                                  <small className="text-muted ms-2">
                                    {new Date(
                                      handover.timestamp
                                    ).toLocaleString()}
                                  </small>
                                </h5>
                                <div className="table-responsive mb-4">
                                  <table className="table table-bordered table-sm">
                                    <tbody>
                                      <tr>
                                        <th style={{ width: "30%" }}>
                                          Approver
                                        </th>
                                        <td>{handover.approver}</td>
                                      </tr>
                                      <tr>
                                        <th>PIC Project</th>
                                        <td>{handover.pic_project}</td>
                                      </tr>
                                      <tr>
                                        <th>Notes</th>
                                        <td>{handover.notes || "-"}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                {handover.evidence && (
                                  <div className="evidence-section">
                                    <h6 className="mb-3">Evidence:</h6>
                                    <div className="row">
                                      {handover.evidence
                                        .split(",")
                                        .map((imageUrl, imgIndex) => (
                                          <div
                                            key={`evidence-out-${imgIndex}`}
                                            className="col-md-4 mb-3"
                                          >
                                            <div className="card h-100">
                                              <img
                                                src={imageUrl.trim()}
                                                className="card-img-top img-fluid"
                                                alt={`Evidence ${imgIndex + 1}`}
                                                style={{
                                                  maxHeight: "200px",
                                                  objectFit: "contain",
                                                }}
                                              />
                                              <div className="card-body p-2 text-center">
                                                <a
                                                  href={imageUrl.trim()}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="btn btn-sm btn-primary"
                                                >
                                                  View Full Size
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-5">
                              <i className="bi bi-clipboard-check fs-1 text-muted mb-3"></i>
                              <h5>No Handover Data Available</h5>
                              <p className="text-muted">
                                No handover checklist found for this project
                              </p>
                            </div>
                          )}
                          {outHandoverData.length > 0 && (
                            <div className="text-center mt-3">
                              <button
                                className="btn btn-success"
                                onClick={handleDownloadOut}
                              >
                                <i className="bi bi-download me-2"></i>
                                Download PDF
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="modal-footer justify-content-center">
                  <ul className="nav nav-pills">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 1 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(1)}
                      >
                        <img
                          width="30"
                          height="30"
                          src="https://img.icons8.com/3d-fluency/94/drone.png"
                          alt="drone"
                        />{" "}
                        UAV
                        {/* <img width="20" height="20" src="https://img.icons8.com/avantgarde/100/drone-bottom-view.png" alt="drone-bottom-view" /> UAV */}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 2 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(2)}
                      >
                        <i className="bi bi-camera me-1"></i> Payload
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 3 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(3)}
                      >
                        <i className="bi bi-geo-alt me-1"></i> GPS
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 4 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(4)}
                      >
                        <i className="bi bi-shield me-1"></i> PPE
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 5 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(5)}
                      >
                        <i className="bi bi-tools me-1"></i> Other
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          currentOutModalPage === 6 ? "active bg-warning" : ""
                        }`}
                        onClick={() => setCurrentOutModalPage(6)}
                      >
                        <i className="bi bi-clipboard-check me-1"></i> Handover
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {showOutModal && <div className="modal-backdrop fade show"></div>}

          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center">
              <div>
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                {filteredData.length} entries
              </div>
              <nav aria-label="Page navigation">
                <ul className="pagination pagination-sm">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-double-left"></i>
                    </button>
                  </li>
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {/* Page numbers - show limited range */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Checklistdb;



