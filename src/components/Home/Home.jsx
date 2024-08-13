"use client";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";

// Component for Uploading Credentials and Authorizing
function AuthorizationForm() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadCredentials = async () => {
    const formData = new FormData();
    formData.append("credentials", file);

    try {
      const response = await fetch("/api/upload-credentials", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setMessage(result.message || "Error uploading credentials");
    } catch (error) {
      console.error("Error uploading credentials:", error);
      setMessage("Error uploading credentials");
    }
  };

  return (
    <div>
      <h1>Upload Credentials and Authorize</h1>
      <input type="file" onChange={handleFileChange} />
      <Button onClick={handleUploadCredentials} variant="contained">
        Upload Credentials
      </Button>
      <p>{message}</p>
      <a href="/api/oauth2/init">Authorize with Google</a>
    </div>
  );
}

// Component for Sending Emails
function SendEmailForm() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sender, setSender] = useState("");
  const [username, setUsername] = useState(null);
  const [batchSize, setBatchSize] = useState(50);
  const [delayTime, setDelayTime] = useState(10); // Default 10 seconds
  const [message, setMessage] = useState("");

  const getUsername = username?.name.split(".json")[0];

  // Fetch a random name every 3 seconds and update the sender field
  useEffect(() => {
    const fetchRandomName = async () => {
      try {
        const response = await fetch("https://randomuser.me/api/");
        const data = await response.json();
        const user = data.results[0];
        const name = `${user.name.first} ${user.name.last}`;
        return name;
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

    const response = await fetch("/api/send-email", {
      method: "POST",
      body: formData,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    let { value, done } = await reader.read();
    while (!done) {
      result += decoder.decode(value);
      setMessage(result);
      ({ value, done } = await reader.read());
    }
  };

  return (
    <div>
      <h1>Send Email</h1>
      <input
        type="email"
        placeholder="Recipient Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <input
        type="text"
        placeholder="Sender Name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />
      <input type="file" onChange={(e) => setUsername(e.target.files[0])} />
      <textarea
        placeholder="HTML Content"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
      />
      <input type="file" multiple onChange={handleAttachmentsChange} />
      <input
        type="number"
        placeholder="Batch Size"
        value={batchSize}
        onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
      />
      <input
        type="number"
        placeholder="Delay Time (in seconds)"
        value={delayTime}
        onChange={(e) => setDelayTime(parseInt(e.target.value, 10))}
      />
      <Button onClick={handleSendEmail} variant="contained">
        Send Email
      </Button>
      <pre>{message}</pre>
    </div>
  );
}

// Main Component that includes both Authorization and Send Email Forms
export default function Home() {
  return (
    <div>
      <AuthorizationForm />
      <SendEmailForm />
    </div>
  );
}
