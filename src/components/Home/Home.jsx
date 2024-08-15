"use client";
import { Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

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
  // Component for Uploading Credentials and Authorizing
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Component for Sending Emails
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
  const getUsername = username?.name?.split(".json")[0];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadCredentials = async () => {
    if (!file || !user) {
      setMessage("Please select a file and ensure you are logged in.");
      return;
    }

    setLoading(true);
    setMessage(""); // Clear previous messages

    const formData = new FormData();
    formData.append("credentials", file);
    formData.append("userId", user.id); // Ensure user.id is correct

    try {
      const response = await fetch("/api/upload-credentials", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload credentials");
      }

      const result = await response.json();
      setMessage(result.message || "Credentials uploaded successfully");
    } catch (error) {
      console.error("Error uploading credentials:", error);
      setMessage("Error uploading credentials: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a random name every 3 seconds and update the sender field
  useEffect(() => {
    const fetchRandomName = async () => {
      try {
        const response = await fetch("https://randomuser.me/api/");
        const data = await response.json();
        const user = data.results[0];
        return `${user.name.first} ${user.name.last}`;
      } catch (error) {
        console.error("Error fetching random name:", error);
        return "Unknown Sender";
      }
    };

    const intervalId = setInterval(async () => {
      const name = await fetchRandomName();
      setSender(name);
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleAttachmentsChange = (e) => {
    setAttachments([...e.target.files]);
  };

  const handleSendEmail = async () => {
    if (!email || !subject || !html) {
      setMessage("Please fill out all required fields.");
      return;
    }

    setSendLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("to", email);
    formData.append("subject", subject);
    formData.append("html", html);
    formData.append("sender", sender);
    formData.append("username", getUsername);
    formData.append("batchSize", batchSize);
    formData.append("delayTime", delayTime);

    attachments.forEach((attachment) => {
      formData.append("attachments", attachment);
    });

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      let { value, done } = await reader.read();
      while (!done) {
        result += decoder.decode(value);
        ({ value, done } = await reader.read());
      }

      setSendMessage(result || "Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      setSendMessage("Error sending email: " + error.message);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex gap-4 my-5">
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
                <div className="flex items-center gap-4">
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

              <div className="flex justify-between gap-4 mt-5">
                {/* left */}
                <div>
                  <div className="flex gap-4">
                    <div>
                      <Typography variant="p" className="p-2 font-bold">
                        Sender
                      </Typography>
                      <TextField
                        id="outlined-basic"
                        label="Sender Name"
                        variant="outlined"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        className="w-full p-2 "
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Typography variant="p" className="font-bold">
                        Upload Credentials File
                      </Typography>
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
                          onChange={(e) => setUsername(e.target.files[0])}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4 mt-4">
                    <div className="w-full">
                      <Typography variant="p" className="p-2 font-bold">
                        Subject
                      </Typography>
                      <TextField
                        id="outlined-basic"
                        label="Subject"
                        variant="outlined"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2"
                      />
                    </div>
                    <div className="w-full">
                      <Typography variant="p" className="p-2 font-bold">
                        Email Batch Size
                      </Typography>
                      <TextField
                        id="outlined-basic"
                        label="Batch Size"
                        variant="outlined"
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        className="w-full p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* right */}
                <div>
                  <Typography variant="p" className="p-2 font-bold">
                    Break Time
                  </Typography>
                  <TextField
                    id="outlined-basic"
                    label="Delay Time (in seconds)"
                    variant="outlined"
                    value={delayTime}
                    onChange={(e) => setDelayTime(parseInt(e.target.value))}
                    className="w-full p-2 "
                  />
                </div>
              </div>

              {/* Email List & Send Email */}
              <div className="flex gap-4 mt-5">
                {/* Email List */}
                <div className="w-full">
                  <Typography variant="p" className="font-bold">
                    Email List
                  </Typography>
                  <textarea
                    name=""
                    cols="30"
                    rows="10"
                    id=""
                    placeholder="Enter Email List"
                    className="w-full p-2 border-2 rounded-lg border-blue-950"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  ></textarea>
                </div>

                {/* Send Email */}
                <div className="w-full">
                  <Typography variant="p" className="font-bold">
                    Text / HTML Content
                  </Typography>
                  <textarea
                    placeholder="HTML Content"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    name=""
                    cols="30"
                    rows="10"
                    id=""
                    className="w-full p-2 border-2 rounded-lg border-blue-950"
                  ></textarea>

                  <div className="flex justify-between gap-4 mt-4">
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

        {/* Right Side */}
        <div className="w-full basis-1/3">
          <Card className="w-full p-5">
            <CardContent>
              <h1>Coming Soon</h1>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
