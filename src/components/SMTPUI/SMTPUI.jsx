"use client";
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast, { Toaster } from "react-hot-toast";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const SMTPUI = () => {
  // Credentials and Authorizing
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Sending Emails
  const [email, setEmail] = useState(""); //Email List
  const [logo, setLogo] = useState(""); //Logo
  const [subject, setSubject] = useState(""); //Subject
  const [html, setHtml] = useState(""); //HTML
  const [attachments, setAttachments] = useState([]);
  const [sender, setSender] = useState(""); //Sender Name
  const [batchSize, setBatchSize] = useState(""); //Batch Size
  const [delayTime, setDelayTime] = useState(""); //Break Time
  const [sendLoading, setSendLoading] = useState(false);
  const [random, setRandom] = useState(false); //Random User
  const [emailHeader, setEmailHeader] = useState(false); //Email Header
  const [host, setHost] = useState(""); //SMTP Host
  const [port, setPort] = useState(""); //SMTP Port
  const [smtpUser, setSmtpUser] = useState(""); //SMTP User
  const [password, setPassword] = useState(""); //SMTP Password

  const [useCustomSmtp, setUseCustomSmtp] = useState(false); //Use Custom SMTP
  // Sent Details
  const [mailResult, setMailResult] = useState([]);
  const [totalEmailCount, setTotalEmailCount] = useState("");
  //Get From Database
  const [smtps, setSmtps] = useState([]);

  // Delete SMTP
  const handleDeleteSMTP = async () => {
    try {
      const response = await fetch(`/api/smtp/delete`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("SMTP deleted successfully");
      } else {
        toast.error(`Error deleting SMTP`);
      }
      fetchSMTPInfo();
    } catch (error) {
      toast.error(`Error deleting SMTP`);
    }
  };

  // Dialog
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSMTPCheckboxChange = (e) => {
    setUseCustomSmtp(e.target.checked);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Upload SMTP
  const handleUploadSMTP = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    try {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileContent = e.target.result;
          try {
            const response = await fetch("/api/smtp/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: fileContent,
            });

            const result = await response.json();
            if (response.ok) {
              toast.success(`${file.name} uploaded successfully`);
              setFiles([]);
            } else {
              toast.error(`Error uploading ${file.name}: ${result.message}`);
            }
            fetchSMTPInfo();
          } catch (error) {
            toast.error(`Error uploading ${file.name}: ${error.message}`);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch SMTP Info

  const fetchSMTPInfo = async () => {
    try {
      const response = await fetch("/api/smtp/upload");
      const data = await response.json();
      setSmtps(data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchSMTPInfo();
  }, []);

  // Fetch a random name
  const fetchRandomName = async () => {
    try {
      const response = await fetch("https://randomuser.me/api/?nat=us");
      const data = await response.json();
      const user = data.results[0];
      const userName = `${user.name.first} ${user.name.last}`;
      return userName;
    } catch (error) {
      console.error("Error fetching random name:", error);
      return "Unknown Sender";
    }
  };

  // Upload Text File
  const handleTextFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;

        try {
          const response = await fetch("/api/upload-text-file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileContent }),
          });

          if (response.ok) {
            console.log("File uploaded successfully");
            toast.success("File uploaded successfully");
          } else {
            console.error("Error uploading file:", response.statusText);
          }
        } catch (error) {
          console.error("Error uploading text file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAttachmentsChange = (e) => {
    setAttachments([...e.target.files]);
  };

  // Send Email
  const handleSendEmail = async () => {
    // Check required fields
    if (!email || !subject || !html) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setSendLoading(true);
    setMessage("");
    setMailResult([]);

    // Split emails and set total count
    const emailList = email
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);
    const totalEmails = emailList.length; // Define totalEmails correctly

    setTotalEmailCount(totalEmails); // Update state correctly

    try {
      const decoder = new TextDecoder();

      for (let i = 0; i < totalEmails; i++) {
        const recipient = emailList[i];

        // Fetch a new random sender name if needed
        let currentSender = sender;
        if (random) {
          currentSender = await fetchRandomName();
          console.log("Using random sender:", currentSender);
        }

        // Prepare form data for each email
        const formData = new FormData();
        formData.append("to", recipient);
        formData.append("subject", subject);
        formData.append("html", html);
        formData.append("sender", currentSender);
        formData.append("batchSize", batchSize);
        formData.append("delayTime", delayTime);
        formData.append("emailHeader", emailHeader);
        formData.append("logo", logo);
        formData.append("currentEmailCount", i + 1);
        formData.append("totalEmailCount", totalEmails);
        formData.append("host", host);
        formData.append("port", port);
        formData.append("smtpUser", smtpUser);
        formData.append("password", password);

        attachments.forEach((attachment) => {
          formData.append("attachments", attachment);
        });

        const response = await fetch("/api/send-email-smtp", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          toast.error("Failed to send email");
          throw new Error("Failed to send email");
        }

        const reader = response.body.getReader();
        let result = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          result += decoder.decode(value, { stream: true });

          const parts = result.split("\n");
          for (let j = 0; j < parts.length - 1; j++) {
            try {
              const emailResult = JSON.parse(parts[j]);

              setMailResult((prev) => [...prev, emailResult]);

              if (
                emailResult.currentEmailCount &&
                emailResult.totalEmailCount
              ) {
                toast.success("Email sent successfully");
                setMessage(
                  `Sent email ${emailResult.currentEmailCount} of ${emailResult.totalEmailCount}`
                );
              }
            } catch (e) {
              console.error("Failed to parse JSON part:", parts[j], e);
            }
          }

          result = parts[parts.length - 1];
        }

        if (result.trim()) {
          try {
            const emailResult = JSON.parse(result);
            setMailResult((prev) => [...prev, emailResult]);

            if (emailResult.currentEmailCount && emailResult.totalEmailCount) {
              setMessage(
                `Sent email ${emailResult.currentEmailCount} of ${emailResult.totalEmailCount}`
              );
            }
          } catch (e) {
            console.error("Failed to parse last JSON part:", result, e);
          }
        }

        // Add delay if needed
        if (i < totalEmails - 1 && delayTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayTime * 1000));
        }
      }
    } catch (error) {
      setMessage("Error sending email: " + error.message);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="container">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col w-full gap-4 my-5 lg:flex-row">
        {/* Left Side */}
        <div className="w-full basis-2/3">
          <Card className="w-full p-5">
            <CardContent>
              {/* SMTP Information */}
              <div className="mb-5">
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  className="font-bold"
                >
                  SMTP Info{" "}
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    onClick={handleClickOpen}
                  >
                    Delete All SMTP
                  </Button>
                </Typography>
                {/* Delete All SMTP */}
                <>
                  <Dialog
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <DialogTitle id="alert-dialog-title">
                      {"Are you sure you want to delete all SMTP?"}
                    </DialogTitle>

                    <DialogActions>
                      <Button
                        onClick={() => {
                          handleClose();
                          handleDeleteSMTP();
                        }}
                      >
                        Yes
                      </Button>
                      <Button onClick={handleClose} autoFocus>
                        No
                      </Button>
                    </DialogActions>
                  </Dialog>
                </>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <p className="font-bold">
                      Total SMTP: {smtps?.smtps?.length}
                    </p>
                  </AccordionSummary>
                  <div className="h-[100px]  overflow-y-scroll">
                    {smtps?.smtps?.map((smtp) => {
                      return (
                        <p key={smtp.id} className="px-2 py-[5px] font-bold">
                          {smtp?.user}
                        </p>
                      );
                    })}
                  </div>
                </Accordion>
              </div>
              {/* Upload Credentials and Authorize */}
              <div>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  className="font-bold"
                >
                  Upload SMTP
                </Typography>
                <div className="flex flex-col w-full gap-4 md:flex-row">
                  <div>
                    <Button
                      component="label"
                      role={undefined}
                      variant="contained"
                      tabIndex={-1}
                      startIcon={<CloudUploadIcon />}
                      size="large"
                    >
                      Upload JSON File
                      <VisuallyHiddenInput
                        type="file"
                        multiple
                        accept=".json"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleUploadSMTP}
                      disabled={loading}
                      sx={{ backgroundColor: "#0A123E" }}
                    >
                      {loading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>

              
              

              <div className="mt-5 ml-2">
                <FormControlLabel
                  control={<Checkbox />}
                  label="Random Name"
                  checked={random}
                  onChange={(e) => setRandom(e.target.checked)}
                />
              </div>

              <div className="flex flex-col justify-between w-full gap-4 lg:flex-row">
                <div className="w-full">
                  <div className="flex flex-col w-full gap-4 lg:items-center md:flex-row">
                    <div className="w-full">
                      <p className="ml-2 font-semibold">Sender </p>
                      <TextField
                        id="sender"
                        label="Sender Name"
                        variant="outlined"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        className="w-full p-2 "
                        disabled={random}
                      />
                    </div>
                    <div className="w-full">
                      <p className="ml-2 font-semibold">Break Time</p>
                      <TextField
                        id="break-time"
                        label="Delay Time (in seconds) e.g. 5"
                        variant="outlined"
                        value={delayTime}
                        onChange={(e) => setDelayTime(parseInt(e.target.value))}
                        className="w-full p-2 "
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 mt-4 md:flex-row">
                    <div className="w-full">
                      <p className="ml-2 font-semibold">Subject</p>
                      <TextField
                        id="subject"
                        label="e.g. Invoice"
                        variant="outlined"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2"
                      />
                    </div>
                    <div className="w-full">
                      <p className="ml-2 font-semibold">Email Batch Size</p>
                      <TextField
                        id="batch-size"
                        label="e.g. 10"
                        variant="outlined"
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        className="w-full p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="w-full my-2">
                <p className="font-semibold">Logo Box</p>
                <textarea
                  placeholder="Enter Logo HTML"
                  className="w-full p-2 border-blue-950"
                  style={{ border: "1px solid #ccc" }}
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                ></textarea>
              </div>

              {/* Random Email Header */}
              <div className="">
                <div className="my-2">
                  <FormControlLabel
                    control={<Checkbox />}
                    label="Random Email Header"
                    checked={emailHeader}
                    onChange={(e) => setEmailHeader(e.target.checked)}
                  />
                </div>

                <div className="w-full">
                  <div className="mb-4">
                    <p className="font-semibold">Random Email Header </p>
                    <Button
                      component="label"
                      variant="contained"
                      role={undefined}
                      tabIndex={-1}
                      startIcon={<CloudUploadIcon />}
                      size="large"
                    >
                      Upload Text File
                      <VisuallyHiddenInput
                        type="file"
                        onChange={handleTextFileChange}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email List & Send Email */}
              <div className="flex flex-col gap-4 mt-5 lg:flex-row">
                {/* Email List */}
                <div className="w-full">
                  <p className="font-semibold">Email List</p>
                  <textarea
                    cols="30"
                    rows="10"
                    id="email-list"
                    placeholder="Enter Email List"
                    className="w-full p-2 border-blue-950"
                    style={{ border: "1px solid #ccc" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  ></textarea>
                </div>
                {/* Send Email */}
                <div className="w-full">
                  <p className="font-semibold">Text / HTML Content</p>
                  <textarea
                    cols="30"
                    rows="10"
                    placeholder="Text / HTML Content"
                    className="w-full p-2 border-blue-950"
                    style={{ border: "1px solid #ccc" }}
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                  ></textarea>

                  <div className="flex flex-col justify-between gap-4 mt-5 md:flex-row">
                    <Button
                      component="label"
                      role={undefined}
                      variant="contained"
                      tabIndex={-1}
                      startIcon={<CloudUploadIcon />}
                      size="large"
                    >
                      Upload Attachment
                      <VisuallyHiddenInput
                        type="file"
                        multiple
                        onChange={handleAttachmentsChange}
                      />
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      variant="contained"
                      disabled={sendLoading}
                      size="large"
                      sx={{ backgroundColor: "#0A123E" }}
                    >
                      {sendLoading ? "Sending..." : "Send Email"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Email Details*/}
        <div className="w-full  p-5 overflow-x-hidden lg:h-[1085px] h-0 basis-1/3 MuiCard-root-css relative">
          <h1 className="text-3xl font-bold">Sent Details</h1>
          <div>
            <pre>
              {mailResult &&
                [...mailResult].reverse().map((item, index) => (
                  <div key={index} className="flex flex-col gap-3 ">
                    <div className="p-2 my-4 border-2 border-blue-950">
                      <p className="font-semibold text-green-600">
                        {item?.message}
                      </p>
                      <p className="font-semibold ">To: {item?.to}</p>
                      <p className="absolute top-[-40px] right-5 flex justify-center gap-2 items-center bg-blue-950 text-white px-3 py-1 rounded">
                        <span className="text-2xl font-bold">{index + 1}</span>
                        {"/"}
                        <span className="text-2xl font-bold">
                          {totalEmailCount}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMTPUI;
