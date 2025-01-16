"use client";
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast, { Toaster } from "react-hot-toast";
import DoneIcon from "@mui/icons-material/Done";
import SendIcon from "@mui/icons-material/Send";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
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

const Home = () => {
  // Credentials and Authorizing
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Sending Emails
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sender, setSender] = useState("");
  const [username, setUsername] = useState("");
  const [batchSize, setBatchSize] = useState("");
  const [delayTime, setDelayTime] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [random, setRandom] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [emailHeader, setEmailHeader] = useState(false);
  const [thankYouFile, setThankYouFile] = useState(false);
  // Sent Details
  const [mailResult, setMailResult] = useState([]);
  const [totalEmailCount, setTotalEmailCount] = useState("");
  const [smtps, setSmtps] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [testMail, setTestMail] = useState("");
  const [currentEmail, setCurrentEmail] = useState([]);

  const sendTestEmail = async () => {
    try {
      if (!testMail) {
        toast.error("Please fill out all required fields.");
        return;
      }

      const recipient = testMail;
      let currentSender = sender;
      currentSender = await fetchRandomName();

      const formData = new FormData();
      formData.append("to", recipient);
      formData.append("sender", currentSender);
      formData.append("username", username);

      const response = await fetch("/api/test-oauth-mail", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to send email to ${recipient}`);
      } else {
        toast.success(`Email sent successfully`);
      }
    } catch (error) {
      console.error("Error sending email", error);
      toast.error("Error sending email");
    }
  };

  // Send Test Mail

  const handleButtonClick = () => {
    handleTestClose();
    sendTestEmail();
  };

  // Handle File Change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload Credentials
  const handleUploadCredentials = async () => {
    if (!file || !user) {
      toast.error("Please select a file and ensure you are logged in.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("credentials", file);
    formData.append("userId", user.id);

    try {
      const response = await fetch("/api/upload-credentials", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload credentials");
      }

      const result = await response.json();
      fetchSMTPInfo();
      toast.success(`Credentials uploaded successfully`);
    } catch (error) {
      console.error("Error uploading credentials:", error);
      toast.error("Error uploading credentials");
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch SMTP Info
  const fetchSMTPInfo = async () => {
    try {
      const response = await fetch("/api/get-username", { method: "GET" });
      const data = await response.json();

      // Set the response directly if it's an object, otherwise set an empty array
      if (Array.isArray(data)) {
        setSmtps(data);
      } else if (data.username) {
        setSmtps([data]); // Convert to an array with a single item
      } else {
        console.error("Unexpected response:", data);
        setSmtps([]);
      }
    } catch (error) {
      console.error("Error fetching SMTP info:", error);
    }
  };

  useEffect(() => {
    fetchSMTPInfo();
  }, []);

  // // Delete SMTP
  // const handleUpdateSMTP = async () => {
  //   try {
  //     const response = await fetch(`/api/update-smtp`, {
  //       method: "PATCH",
  //     });
  //     if (response.ok) {
  //       toast.success("SMTP deleted successfully");
  //     } else {
  //       toast.error(`Error deleting SMTP`);
  //     }
  //     fetchSMTPInfo();
  //   } catch (error) {
  //     toast.error(`Error deleting SMTP`);
  //   }
  // };

  // Delete SMTP
  const handleDeleteSMTP = async () => {
    try {
      const response = await fetch(`/api/json`, {
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

  // Upload Thank you message File
  const handleThankYouFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;

        try {
          const response = await fetch("/api/upload-thank-you-file", {
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

  // Upload Attachments
  const handleAttachmentsChange = (e) => {
    setAttachments([...e.target.files]);
  };

  // Fetch Random Username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch("/api/get-username");
        if (!response.ok) {
          throw new Error("Failed to fetch username");
        }
        const data = await response.json();
        setUsername(data.username);
      } catch (error) {
        console.log("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, []);

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
        formData.append("username", username);
        formData.append("batchSize", batchSize);
        formData.append("delayTime", delayTime);
        formData.append("emailHeader", emailHeader);
        formData.append("thankYouFile", thankYouFile);
        formData.append("currentEmailCount", i + 1);
        formData.append("totalEmailCount", totalEmails);

        attachments.forEach((attachment) => {
          formData.append("attachments", attachment);
        });

        const response = await fetch("/api/send-email", {
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

              // setMailResult((prev) => [...prev, emailResult]);
              setMailResult((prev) => [
                ...prev,
                { ...emailResult, originalIndex: prev.length + 1 },
              ]);

              setCurrentEmail([emailResult?.to]);

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

      <div className="flex flex-col w-full gap-4 my-5 lg:flex-row">
        {/* Left Side */}
        <div className="w-full  lg:w-[22%]">
          <h1 className="mb-2 text-2xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2 textStyle">
            SMTP List
          </h1>

          <div className="flex flex-col justify-between gap-4 mt-5 mb-4 lg:flex-row ">
            <div className="w-full">
              <div
                id="smtp-list"
                className="w-full lg:h-[500px] h-[200px] overflow-y-auto inputCss"
                readOnly
              >
                <p className="font-bold">Total SMTP: {smtps?.length}</p>
                {smtps?.map((smtp, index) => {
                  return (
                    <p
                      key={index}
                      className="px-2 py-[5px] font-bold text-[14px]"
                    >
                      {index + 1}. {smtp?.username}
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
                    <DialogTitle
                      id="alert-dialog-title"
                      className="text-red-500"
                    >
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
          </div>
        </div>

        {/* Middle Side */}
        <div className="w-full lg:w-[56%]">
          <h1 className="mb-2 text-2xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2 textStyle">
            Upload Credentials and Authorize
          </h1>
          {/* Top Section */}
          <div className="flex flex-col items-end justify-between w-full gap-4 lg:flex-row">
            <div className="w-full">
              <p className="font-semibold text-right text-white">
                Upload JSON File
              </p>
              <Button
                component="label"
                variant="contained"
                role={undefined}
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                size="large"
                className="bg-[var(--gray-clr)] text-black hover:bg-[var(--green-clr)]  w-full "
              >
                Upload Json
                <VisuallyHiddenInput type="file" onChange={handleFileChange} />
              </Button>
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
                onClick={handleUploadCredentials}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Credentials"}
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
                      id="test-email-oauth"
                      placeholder="test email"
                      className="w-full inputCss"
                      onChange={(e) => setTestMail(e.target.value)}
                    />
                  </DialogTitle>

                  <DialogActions>
                    <Button onClick={handleButtonClick}>Send</Button>
                    <Button onClick={handleTestClose} autoFocus>
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between w-full gap-4 mt-2 lg:flex-row">
            <div className="w-full lg:w-1/2">
              <Button
                variant="contained"
                className="font-semibold text-white testSMTPBtn hover:text-black hover:bg-[var(--gray-clr)]"
                href="/api/oauth2/init"
              >
                Click to Authorize
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="mb-2 text-2xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2 textStyle">
              Email Details
            </h1>
          </div>
          {/* Middle Section */}
          <div className="flex flex-col items-end justify-between gap-4 mb-2 md:flex-row">
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

          <div className="flex flex-col justify-between gap-4 mb-2 lg:flex-row">
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
              <p className="font-semibold text-right text-white">Delay</p>
              <div className="flex w-full gap-2">
                <div className="w-full">
                  <input
                    type="text"
                    id="batch-size"
                    placeholder="Quantity e.g 10"
                    className="w-full inputCss"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  />
                </div>

                <div className="w-full">
                  <input
                    type="text"
                    id="delay-time"
                    placeholder="Time (in seconds) e.g 5"
                    className="w-full inputCss"
                    value={delayTime}
                    onChange={(e) => setDelayTime(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between w-full gap-4 md:flex-row">
            <div className="w-full">
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
                className="bg-[var(--gray-clr)] text-black hover:bg-[var(--green-clr)]  w-full "
              >
                Upload Text File
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleTextFileChange}
                />
              </Button>
            </div>
            <div className="flex flex-col w-full gap-4 lg:items-center md:flex-row">
              <div className="flex items-center gap-2 lg:justify-center">
                <p className="font-semibold text-white">Random Header</p>
                <Checkbox
                  className="text-white"
                  checked={emailHeader}
                  onChange={(e) => setEmailHeader(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between w-full gap-4 mt-2 md:flex-row">
            <div className="w-full">
              <p className="font-semibold text-right text-white">
                Upload Thank You Message File
              </p>
              <Button
                component="label"
                variant="contained"
                role={undefined}
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                size="large"
                className="bg-[var(--gray-clr)] text-black hover:bg-[var(--green-clr)]  w-full "
              >
                Upload Text File
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleThankYouFileChange}
                />
              </Button>
            </div>
            <div className="flex flex-col w-full gap-4 lg:items-center md:flex-row">
              <div className="flex items-center gap-2 lg:justify-center">
                <p className="font-semibold text-white">Random Thank You</p>
                <Checkbox
                  className="text-white"
                  checked={thankYouFile}
                  onChange={(e) => setThankYouFile(e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col justify-between gap-4 mt-2 mb-4 lg:flex-row ">
            <div className="w-full">
              <div>
                <p className="font-semibold text-right text-white">HTML Body</p>
                <textarea
                  name="textarea"
                  id="html-body"
                  rows="8"
                  className="w-full inputCss"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="w-full">
              <div>
                <p className="font-semibold text-right text-white">Recepient</p>
                <textarea
                  name="textarea"
                  id="recepient"
                  rows="8"
                  className="w-full inputCss"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
        <div className="w-full lg:w-[22%]">
          <div className="w-full">
            <h1 className="mb-4 text-2xl font-bold text-white border-b-2 border-b-[var(--green-clr)] pb-2 textStyle">
              Sent Details
            </h1>

            <div className="relative w-full mb-4">
              <p className="font-semibold text-right text-white">Sent Item</p>

              <div
                id="delivered-list"
                className="w-full h-[130px] inputCss"
                readOnly
              >
                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 ">
                        <p className="absolute top-[-10px]  flex justify-center gap-2 bg-[var(--body-clr)] items-center text-white px-2 rounded">
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
                        className="absolute flex flex-col gap-3 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                      >
                        <div className="">
                          {item.message === "Failed to send email" ? (
                            <>
                              <p className="font-semibold text-red-600 break-words mt-[20px] text-[14px]">
                                {item?.message}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold break-words mt-[20px] text-[14px]">
                                {index + 1} {currentEmail}{" "}
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

            <div className="relative w-full">
              <p className="font-semibold text-right text-white">Delivered</p>

              <div
                id="delivered-list"
                className="w-full lg:h-[300px] h-[200px] inputCss overflow-y-scroll no-scrollbar"
                readOnly
              >
                <pre>
                  {mailResult &&
                    [...mailResult].reverse().map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 ">
                        <p className="absolute top-[-10px]  flex justify-center gap-2 bg-[var(--body-clr)] items-center text-white px-2 rounded">
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
                    [...mailResult].reverse().map((item) => (
                      <div
                        key={item.originalIndex}
                        className="flex flex-col gap-3 "
                      >
                        <div className="">
                          {item.message === "Failed to send email" ? (
                            <>
                              <p className="font-semibold text-red-600 break-words text-[14px]">
                                {item?.message}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold break-words text-[14px]">
                                {item.originalIndex} {item?.to}{" "}
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

export default Home;
