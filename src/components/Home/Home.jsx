"use client";
import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast, { Toaster } from "react-hot-toast";

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
  const [sendMessage, setSendMessage] = useState("");
  const [random, setRandom] = useState(false);
  const [emailHeader, setEmailHeader] = useState(false);
  // Sent Details
  const [mailResult, setMailResult] = useState([]);
  console.log(mailResult);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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

  //  Username
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
    if (!email || !subject || !html) {
      setMessage("Please fill out all required fields.");
      return;
    }

    setSendLoading(true);
    setMessage("");
    setMailResult([]);

    const emailList = email
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      const decoder = new TextDecoder();
      const totalEmails = emailList.length;

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
        formData.append("sender", currentSender); // Use updated sender name
        formData.append("username", username);
        formData.append("batchSize", batchSize);
        formData.append("delayTime", delayTime);
        formData.append("emailHeader", emailHeader);

        attachments.forEach((attachment) => {
          formData.append("attachments", attachment);
        });

        const response = await fetch("/api/send-email", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to send email");
        }

        const reader = response.body.getReader();
        let result = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          result += decoder.decode(value, { stream: true });

          const parts = result.split("\n");
          for (let i = 0; i < parts.length - 1; i++) {
            try {
              const emailResult = JSON.parse(parts[i]);
              setMailResult((prev) => [...prev, emailResult]);

              if (
                emailResult.currentEmailCount &&
                emailResult.totalEmailCount
              ) {
                setMessage(
                  `Sent email ${emailResult.currentEmailCount} of ${emailResult.totalEmailCount}`
                );
              }
            } catch (e) {
              console.error("Failed to parse JSON part:", parts[i], e);
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
      console.error("Error sending email:", error);
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
              {/* Upload Credentials and Authorize */}
              <div>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  className="font-bold"
                >
                  Upload Credentials and Authorize
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
                      Upload file
                      <VisuallyHiddenInput
                        type="file"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleUploadCredentials}
                      disabled={loading}
                      sx={{ backgroundColor: "#0A123E" }}
                    >
                      {loading ? "Uploading..." : "Upload Credentials"}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-blue-800">{message}</p>
                <Button
                  className="mt-4"
                  variant="contained"
                  size="large"
                  href="/api/oauth2/init"
                  sx={{ backgroundColor: "#0A123E" }}
                >
                  Authorize with Google
                </Button>
              </div>

              <div className="mt-5">
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
                      <p className="font-semibold">Sender </p>
                      <TextField
                        id="outlined-basic"
                        label="Sender Name"
                        variant="outlined"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        className="w-full p-2 "
                        disabled={random}
                      />
                    </div>
                    <div className="w-full">
                      <p className="font-semibold">Break Time</p>
                      <TextField
                        id="outlined-basic"
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
                      <p className="font-semibold">Subject</p>
                      <TextField
                        id="outlined-basic"
                        label="e.g. Invoice"
                        variant="outlined"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2"
                      />
                    </div>
                    <div className="w-full">
                      <p className="font-semibold">Email Batch Size</p>
                      <TextField
                        id="outlined-basic"
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
                    name=""
                    cols="30"
                    rows="10"
                    id=""
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
                    name=""
                    cols="30"
                    rows="10"
                    id=""
                    placeholder="Enter Text / HTML"
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
        <div className="w-full  p-5 overflow-x-hidden h-[992px] basis-1/3 MuiCard-root-css">
          <h1 className="text-3xl font-bold">Sent Details</h1>
          <div>
            <pre>
              {mailResult &&
                mailResult.map((item, index) => (
                  <div key={index} className="flex flex-col gap-3">
                    <div className="p-2 my-4 border-2 border-blue-950">
                      <p className="font-semibold text-green-600">
                        {item?.message}
                      </p>
                      <p>
                        Count:{" "}
                        <span className="font-bold">
                          {item?.currentEmailCount}
                        </span>
                      </p>
                      <p>
                        Total Count:{" "}
                        <span className="font-bold">
                          {item?.totalEmailCount}
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

export default Home;
