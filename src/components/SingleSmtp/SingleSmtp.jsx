"use client";
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast, { Toaster } from "react-hot-toast";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import DoneIcon from "@mui/icons-material/Done";
import SendIcon from "@mui/icons-material/Send";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import LoopIcon from "@mui/icons-material/Loop";

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

const SingleSMTP = () => {
  // Credentials and Authorizing
  const [message, setMessage] = useState("");
  // Sending Emails
  const [email, setEmail] = useState(""); //Email List
  // const [logo, setLogo] = useState("");
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
  const [secure, setSecure] = useState(false);
  const [testMail, setTestMail] = useState("");
  const [rotate, setRotate] = useState(false);
  const [abortController, setAbortController] = useState(null);

  // Sent Details
  const [mailResult, setMailResult] = useState([]);
  const [error, setError] = useState("");
  const [totalEmailCount, setTotalEmailCount] = useState("");
  //Get From Database
  const [smtps, setSmtps] = useState([]);

  // Send Test Mail
  const sendTestMail = async () => {
    try {
      // Prepare form data for each email
      const formData = new FormData();

      formData.append("host", host);
      formData.append("port", port);
      formData.append("smtpUser", smtpUser);
      formData.append("password", password);
      formData.append("secure", secure);
      formData.append("testMail", testMail);

      const response = await fetch("/api/test-smtp", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Failed to send email");
        throw new Error("Failed to send email");
      }

      if (response.ok) {
        toast.success("Email sent successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Delete SMTP
  const handleDeleteSMTP = async () => {
    try {
      const response = await fetch(`/api/single/upload`, {
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
  const [openTest, setOpenTest] = useState(false);

  const handleTestOpen = () => {
    setOpenTest(true);
  };

  const handleTestClose = () => {
    setOpenTest(false);
  };

  // Dialog
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Upload SMTP
  const handleUploadSMTP = async () => {
    try {
      // Make sure all required fields are provided
      if (!host || !port || !smtpUser || !password) {
        console.error("All fields are required!");
        return;
      }

      const response = await fetch("/api/single/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host,
          port: parseInt(port),
          smtpUser,
          password,
          secure,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData.error);
      } else {
        const data = await response.json();
        fetchSMTPInfo();
        toast.success("SMTP credentials uploaded successfully");
        setHost("");
        setPort("");
        setSmtpUser("");
        setPassword("");
        setSecure(false);
        console.log("SMTP credentials uploaded:", data);
      }
    } catch (error) {
      console.error("Upload failed:", error.message);
    }
  };

  // Fetch SMTP Info

  const fetchSMTPInfo = async () => {
    try {
      const response = await fetch("/api/single/upload", { method: "GET" });
      const data = await response.json();
      setSmtps(data?.smtps);
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

    // Create a new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

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
        // formData.append("logo", logo);
        formData.append("currentEmailCount", i + 1);
        formData.append("totalEmailCount", totalEmails);
        formData.append("host", host);
        formData.append("port", port);
        formData.append("smtpUser", smtpUser);
        formData.append("password", password);
        formData.append("secure", secure);
        formData.append("rotate", rotate);

        attachments.forEach((attachment) => {
          formData.append("attachments", attachment);
        });

        const response = await fetch("/api/send-email-single", {
          method: "POST",
          body: formData,
          signal: controller.signal,
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
      if (error.name === "AbortError") {
        console.log("Email sending is stopped.");
      } else {
        setMessage("Error sending email: " + error.message);
      }
    } finally {
      setSendLoading(false);
      setAbortController(null); // Reset abort controller after completion
    }
  };

  const stopEmailSending = () => {
    if (abortController) {
      abortController.abort(); // Abort the fetch request
      toast.error("Aborting email sending...");
    }
  };

  return (
    <div className="container">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="flex flex-col w-full gap-4 my-10 lg:flex-row">
        {/* Left Side */}
        <div className="w-full basis-3/4">
          <h1 className="mb-4 text-3xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2">
            SMTP Configuration
          </h1>
          {/* Top Section */}
          <div className="flex justify-between gap-4 mb-4">
            <div className="w-full">
              <p className="font-semibold text-right text-white">Host</p>
              <input
                type="text"
                id="host"
                placeholder="Host"
                className="w-full inputCss"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>

            <div className="w-full">
              <p className="font-semibold text-right text-white">User</p>
              <input
                type="text"
                id="user"
                placeholder="User"
                className="w-full inputCss"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
            </div>

            <div className="w-full">
              <p className="font-semibold text-right text-white">Password</p>
              <input
                type="password"
                id="password"
                placeholder="Password"
                className="w-full inputCss"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 mb-4">
            <div className="flex items-center justify-center w-full gap-4">
              <div className="w-full">
                <p className="font-semibold text-right text-white">Port</p>
                <input
                  type="text"
                  id="port"
                  placeholder="Port"
                  className="w-full inputCss"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">
                <p className="font-semibold text-white">SSL</p>
                <Checkbox
                  className="text-white "
                  checked={secure}
                  onChange={(e) => setSecure(e.target.checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end w-full gap-2">
              <Button
                variant="contained"
                onClick={handleTestOpen}
                className="font-semibold text-white testSMTPBtn hover:text-black hover:bg-[var(--gray-clr)]"
              >
                Test SMTP
              </Button>
              <Button
                variant="contained"
                className="font-semibold text-black addSMTPBtn hover:text-white hover:bg-[var(--green-clr)]"
                onClick={handleUploadSMTP}
              >
                Add SMTP
              </Button>

              <>
                <Dialog
                  open={openTest}
                  onClose={handleTestClose}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogTitle id="alert-dialog-title">
                    <input
                      type="email"
                      id="test-email"
                      placeholder="test email"
                      className="w-full inputCss"
                      onChange={(e) => setTestMail(e.target.value)}
                    />
                  </DialogTitle>

                  <DialogActions>
                    <Button
                      onClick={() => {
                        handleTestClose();
                        sendTestMail();
                      }}
                    >
                      Send
                    </Button>
                    <Button onClick={handleTestClose} autoFocus>
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="mb-4 text-3xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2">
              Email Details
            </h1>
          </div>
          {/* Middle Section */}
          <div className="flex items-end justify-between gap-4 mb-4">
            <div className="w-full">
              <p className="font-semibold text-right text-white">Sender Name</p>
              <input
                type="text"
                id="sender-name"
                placeholder="Sender Name"
                className="w-full inputCss"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                disabled={random}
              />
            </div>

            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center justify-center gap-2">
                <p className="font-semibold text-white">Dynamic Sender</p>
                <Checkbox
                  className="text-white"
                  checked={random}
                  onChange={(e) => setRandom(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4 mb-4">
            <div className="w-full">
              <p className="font-semibold text-right text-white">Subject</p>
              <input
                type="text"
                id="subject"
                placeholder="Subject e.g Invoice"
                className="w-full inputCss"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="w-full">
              <p className="font-semibold text-right text-white">Batch Size</p>
              <input
                type="text"
                id="batch-size"
                placeholder="Batch Size e.g 10"
                className="w-full inputCss"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center justify-center gap-2 rotateCss w-[302px]">
              <p className="font-semibold text-black">SMTP Rotate</p>{" "}
              <Checkbox
                className="text-black"
                checked={rotate}
                onChange={(e) => setRotate(e.target.checked)}
              />
              {/* <LoopIcon /> */}
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="font-semibold text-white">Random Email Header</p>
              <Checkbox
                className="text-white"
                checked={emailHeader}
                onChange={(e) => setEmailHeader(e.target.checked)}
              />
            </div>
            <div>
              <p className="font-semibold text-right text-white">
                Upload Header File
              </p>
              <Button
                component="label"
                variant="contained"
                role={undefined}
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                size="large"
                className="bg-[var(--gray-clr)] text-black hover:bg-[var(--green-clr)]"
              >
                Upload Text File
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleTextFileChange}
                />
              </Button>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between gap-4 mt-5 mb-4">
            <div className="w-full">
              <p className="font-semibold text-right text-white">SMTP LIST</p>

              <div
                id="smtp-list"
                className="w-full h-[506px] inputCss"
                readOnly
              >
                <p className="font-bold">Total SMTP: {smtps?.length}</p>
                {smtps?.map((smtp, index) => {
                  return (
                    <p key={smtp.id} className="px-2 py-[5px] font-bold">
                      {index + 1}. {smtp?.user}
                    </p>
                  );
                })}
              </div>

              <div className="w-full mt-5">
                <Button
                  variant="contained"
                  size="large"
                  color="error"
                  onClick={handleClickOpen}
                >
                  Delete All SMTP
                </Button>
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
              </div>
            </div>

            <div className="w-full">
              <div>
                <p className="font-semibold text-right text-white">Recepient</p>
                <textarea
                  name="textarea"
                  id="recepient"
                  rows="17"
                  className="w-full inputCss"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></textarea>
              </div>

              <div>
                <p className="font-semibold text-right text-white">
                  Delay Time
                </p>
                <input
                  type="text"
                  id="delay-time"
                  placeholder="Delay Time (in seconds) e.g 5"
                  className="w-full inputCss"
                  value={delayTime}
                  onChange={(e) => setDelayTime(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="w-full">
              <div>
                <p className="font-semibold text-right text-white">HTML Body</p>
                <textarea
                  name="textarea"
                  id="html-body"
                  rows="17"
                  className="w-full inputCss"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                ></textarea>
              </div>

              <div className="flex flex-col">
                <p className="font-semibold text-right text-white">
                  Attachment File
                </p>
                <Button
                  component="label"
                  variant="contained"
                  role={undefined}
                  tabIndex={-1}
                  startIcon={<CloudUploadIcon />}
                  size="large"
                  className="bg-[var(--gray-clr)] text-black hover:bg-[var(--green-clr)]"
                >
                  Upload Attachments
                  <VisuallyHiddenInput
                    type="file"
                    multiple
                    onChange={handleAttachmentsChange}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Email Details*/}
        <div className="w-full px-2 overflow-x-hidden basis-1/4">
          <div>
            <h1 className="mb-4 text-3xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2">
              Sent Details
            </h1>

            <div className="relative">
              <p className="font-semibold text-right text-white">Sent Item</p>

              <div
                id="delivered-list"
                className="w-full h-[500px] inputCss"
                readOnly
              >
                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 ">
                        <p className="absolute top-[-45px]  flex justify-center gap-2 bg-[var(--body-clr)] items-center text-white px-2 rounded">
                          <span className="text-2xl font-bold">
                            {index + 1}
                          </span>
                          {"/"}
                          <span className="text-2xl font-bold">
                            {totalEmailCount}
                          </span>
                        </p>
                      </div>
                    ))}
                </pre>

                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 bg-[var(--primary-clr)] px-10 py-5 absolute"
                      >
                        <div className="px-2">
                          {item.message === "Failed to send email" ? (
                            <>
                              <p className="font-semibold text-red-600">
                                {item?.message}
                              </p>
                            </>
                          ) : (
                            <>
                              {/* <p className="font-semibold text-green-600">
                                {item?.message}
                              </p> */}
                              <p className="font-semibold ">
                                {index + 1} {item?.to}{" "}
                                <DoneIcon className="text-green-600" />
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </pre>
              </div>
            </div>

            <div className="relative">
              <p className="font-semibold text-right text-white">Delivered</p>

              <div
                id="delivered-list"
                className="w-full h-[500px] inputCss"
                readOnly
              >
                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 ">
                        <p className="absolute top-[-45px]  flex justify-center gap-2 bg-[var(--body-clr)] items-center text-white px-2 rounded">
                          <span className="text-2xl font-bold">
                            {index + 1}
                          </span>
                          {"/"}
                          <span className="text-2xl font-bold">
                            {totalEmailCount}
                          </span>
                        </p>
                      </div>
                    ))}
                </pre>

                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 ">
                        <div className="px-2">
                          {item.message === "Failed to send email" ? (
                            <>
                              <p className="font-semibold text-red-600">
                                {item?.message}
                              </p>
                            </>
                          ) : (
                            <>
                              {/* <p className="font-semibold text-green-600">
                                {item?.message}
                              </p> */}
                              <p className="font-semibold ">
                                {index + 1} {item?.to}{" "}
                                <DoneIcon className="text-green-600" />
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </pre>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-between gap-2 px-4 mt-4">
              <div>
                <Button
                  variant="contained"
                  size="large"
                  color="error"
                  className="font-semibold text-white rounded-full"
                  onClick={stopEmailSending}
                  disabled={!sendLoading}
                >
                  STOP <StopCircleIcon />
                </Button>
              </div>

              <div>
                <Button
                  variant="contained"
                  size="large"
                  className="font-semibold text-white hover:bg-[var(--gray-clr)] bg-[var(--green-clr)] rounded-full"
                  onClick={handleSendEmail}
                  disabled={sendLoading}
                >
                  {sendLoading ? "SENDING..." : "SEND"} <SendIcon />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSMTP;
