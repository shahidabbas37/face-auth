import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function App() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [page, setPage] = useState("signup");
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem("access_token")
  );



  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error
      );

      localStorage.removeItem("access_token");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      fetchCurrentUser();
    }
  }, []);


  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleImageSelect = (event) => {
    const selectedImage = event.target.files[0];

    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      setCameraStream(stream);
      setCameraOpen(true);
    } catch (error) {
      console.error("Camera access failed:", error);

      showToast(
        "Unable to access camera.",
        "error"
      );
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast(
            "Unable to capture photo.",
            "error"
          );
          return;
        }

        const capturedImage = new File(
          [blob],
          "camera-photo.jpg",
          {
            type: "image/jpeg",
          }
        );

        setImage(capturedImage);
        closeCamera();
      },
      "image/jpeg"
    );
  };

  const resetImage = () => {
    setImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !image) {
      showToast(
        "Name, email and image are required.",
        "error"
      );
      return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("email", email);
    formData.append("image", image);

    try {
      const response = await fetch(
        `${API_URL}/auth/signup`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Signup response:", data);

      if (!response.ok) {
        showToast(
          data.detail || "Signup failed.",
          "error"
        );
        return;
      }

      showToast(
        "Account created successfully!"
      );

      setName("");
      setEmail("");
      resetImage();

      setPage("login");
    } catch (error) {
      console.error(
        "Signup request failed:",
        error
      );

      showToast(
        "Unable to connect to backend.",
        "error"
      );
    }
  };

  const handleLogin = async () => {
    if (!email || !image) {
      showToast(
        "Email and image are required.",
        "error"
      );
      return;
    }

    const formData = new FormData();

    formData.append("email", email);
    formData.append("image", image);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        showToast(
          data.detail || "Login failed.",
          "error"
        );
        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      await fetchCurrentUser();

      setIsAuthenticated(true);

      setEmail("");
      resetImage();

      showToast("Login successful!");
    } catch (error) {
      console.error(
        "Login request failed:",
        error
      );

      showToast(
        "Unable to connect to backend.",
        "error"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setIsAuthenticated(false);
    setUser(null);
    setPage("login");

    showToast("Logged out successfully.");
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem(
      "access_token"
    );

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "Delete account response:",
        data
      );

      if (!response.ok) {
        showToast(
          data.detail || "Account deletion failed.",
          "error"
        );
        return;
      }

      localStorage.removeItem("access_token");

      setIsAuthenticated(false);
      setUser(null);
      setPage("signup");

      showToast(
        "Account deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete account request failed:",
        error
      );

      showToast(
        "Unable to connect to backend.",
        "error"
      );
    }
  };

  if (isLoading) {
    return <main className="loading-screen">Loading your account...</main>;
  }

  if (isAuthenticated) {
    return (
      <main className="app-shell">
        {toast && (
          <div className={`toast toast--${toast.type}`} role="status">
            {toast.message}
          </div>
        )}

        <section className="account-panel">
          <div className="brand-mark" aria-hidden="true">F</div>
          <p className="eyebrow">FACE AUTHENTICATION</p>
          <h1>Welcome, {user?.name}</h1>
          <p className="account-copy">Your account is protected with face verification.</p>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
          </dl>
          <div className="account-actions">
            <button className="button button--primary" type="button" onClick={handleLogout}>Logout</button>
            <button className="button button--danger" type="button" onClick={handleDeleteAccount}>Delete account</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {toast && (
        <div className={`toast toast--${toast.type}`} role="status">
          {toast.message}
        </div>
      )}

      <section className="auth-layout">
        <aside className="intro-panel">
          <div className="brand-lockup"><span className="brand-mark" aria-hidden="true">F</span><span>Face ID</span></div>
          <div className="intro-content">
            <p className="eyebrow">A clearer way to sign in</p>
            <h1>Your face.<br />Your identity.</h1>
            <p>Sign in securely with the face you use every day. No passwords to remember, just a quick verification.</p>
          </div>
          <div className="privacy-note"><span className="privacy-dot" /> Private by design <span className="privacy-divider">/</span> Face-secured access</div>
          <div className="orbital-art" aria-hidden="true"><span className="orbit orbit--outer" /><span className="orbit orbit--inner" /><span className="orbit-core">F</span><span className="orbit-spark" /></div>
        </aside>

        <section className="form-panel" aria-labelledby="form-title">
          <div className="mobile-brand brand-lockup"><span className="brand-mark" aria-hidden="true">F</span><span>Face ID</span></div>
          <div className="form-content">
            <div className="mode-switch" aria-label="Authentication mode">
              <button className={page === "login" ? "mode-tab is-active" : "mode-tab"} type="button" onClick={() => setPage("login")}>Sign in</button>
              <button className={page === "signup" ? "mode-tab is-active" : "mode-tab"} type="button" onClick={() => setPage("signup")}>Create account</button>
            </div>
            <p className="eyebrow form-eyebrow">FACE AUTHENTICATION</p>
            <h2 id="form-title">{page === "signup" ? "Create your account" : "Welcome back"}</h2>
            <p className="form-description">{page === "signup" ? "Set up your profile and register your face." : "Enter your email and verify your face to continue."}</p>

            <div className="auth-form">
              {page === "signup" && (
                <label className="field-label">
                  Full name
                  <input className="text-input" type="text" autoComplete="name" placeholder="e.g. Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
              )}
              <label className="field-label">
                Email address
                <input className="text-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>

              <div className="field-label">Face photo</div>
              <div className="photo-controls">
                <label className="upload-button">
                  <span aria-hidden="true">↑</span> Choose a photo
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} />
                </label>
                <button className="button button--secondary" type="button" onClick={openCamera}><span aria-hidden="true">◎</span> Use camera</button>
              </div>
              <p className="field-hint">Use a clear, well-lit photo with your face looking toward the camera.</p>

              {cameraOpen && (
                <div className="camera-box">
                  <video className="camera-video" ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-actions">
                    <button className="button button--primary" type="button" onClick={capturePhoto}>Capture photo</button>
                    <button className="button button--quiet" type="button" onClick={closeCamera}>Cancel</button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden-canvas" />

              {image && (
                <div className="photo-preview">
                  <img src={URL.createObjectURL(image)} alt="Selected face preview" />
                  <div className="photo-meta"><span className="photo-ready">Photo ready</span><span className="photo-filename">{image.name}</span></div>
                  <button className="remove-photo" type="button" onClick={resetImage} aria-label="Remove selected photo">×</button>
                </div>
              )}

              <button className="button button--primary submit-button" type="button" onClick={page === "signup" ? handleSignup : handleLogin}>{page === "signup" ? "Create account" : "Verify and sign in"}<span aria-hidden="true">→</span></button>
            </div>

            <p className="switch-prompt">{page === "signup" ? "Already have an account?" : "New to Face ID?"}<button type="button" onClick={() => setPage(page === "signup" ? "login" : "signup")}>{page === "signup" ? "Sign in" : "Create an account"}</button></p>
            <p className="secure-note"><span aria-hidden="true">⌑</span> Your face data is used only to verify your identity.</p>
          </div>
          <footer className="form-footer">FACE ID <span>SECURE ACCESS, MADE SIMPLE</span></footer>
        </section>
      </section>
    </main>
  );
}

export default App;
