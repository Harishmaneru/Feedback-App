import React, { useState, useRef, useEffect } from 'react';
import { CameraVideoFill } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logo from './assests/onepgr-logo.webp';

const VideoFeedback = () => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [recordingSuccess, setRecordingSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const videoRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        feedback: '',
        videoURL: '',
        sendConfirmationEmail: true,
    });

    const extractYouTubeID = (url) => {
        const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const matches = url.match(regex);
        return matches ? matches[1] : null;
    };


    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const videoURLFromParams = urlParams.get('videoURL');

        if (videoURLFromParams) {
            setFormData(prevData => ({
                ...prevData,
                videoURL: videoURLFromParams
            }));
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isRecording) {
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }

        return () => clearInterval(timerIntervalRef.current);
    }, [isRecording]);

    const formatTime = (timeInSeconds) => {
        const minutes = String(Math.floor(timeInSeconds / 60)).padStart(2, '0');
        const seconds = String(timeInSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
        }
    };

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.style.display = 'block';
                }
                setIsRecording(true);
                setElapsedTime(0);

                const options = { mimeType: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' };
                const recorder = new MediaRecorder(stream, options);
                const chunks = [];

                recorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/mp4' });
                    setRecordedVideo(blob);
                    setRecordingSuccess(true);
                };

                recorder.start();
                setMediaRecorder(recorder);
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
                toast.error('Error accessing camera and microphone. Please ensure you have given the necessary permissions.');
            });
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        if (videoRef.current) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.style.display = 'none';
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.feedback.trim()) errors.feedback = 'Feedback is required';
        if (!recordedVideo && !formData.videoURL) errors.video = 'Please provide a video URL or record a video';
        if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            const submitFormData = new FormData();
            Object.keys(formData).forEach(key => {
                submitFormData.append(key, formData[key]);
            });
            if (recordedVideo) {
                submitFormData.append('video', recordedVideo, 'feedback.mp4');
            }

            // Replace with  actual API endpoint
            fetch('https://api-endpoint.com/feedback', {
                method: 'POST',
                body: submitFormData,
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Server returned ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    setIsLoading(false);
                    toast.success('Feedback submitted successfully!');
                    setFormData({
                        fullName: '',
                        email: '',
                        feedback: '',
                        videoURL: '',
                        sendConfirmationEmail: true,
                    });
                    setRecordedVideo(null);
                    setRecordingSuccess(false);
                    if (videoRef.current) videoRef.current.src = '';
                })
                .catch(error => {
                    console.error('Error submitting feedback:', error);
                    toast.error('Error submitting feedback: ' + error.message);
                    setIsLoading(false);
                });
        } else {
            toast.error('Please fill all required fields before submitting.');
        }
    };

    return (
        <div className="feedback-container">
            <nav className="navbar">
                <div className="navbar-brand">
                    <img src={logo} alt="Document Icon" className="navbar-icon" />
                    <span className="navbar-logo-text"> </span>
                </div>
            </nav>

            <div className="container-fluid bg-light py-4 py-md-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div className="card shadow-lg border-0 rounded-lg">
                            <div className="card-body p-3 p-md-5">
                            <h4 class="form-heading mb-4 text-start">Share Your Feedback:</h4>
                                <form onSubmit={handleSubmit} className="feedback-form">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <div className="form-floating mb-3 mb-md-0">
                                                <input className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`} id="fullName" name="fullName" type="text" placeholder="Enter your full name" value={formData.fullName} onChange={handleInputChange} required />
                                                <label htmlFor="fullName">Full name<span className="text-danger ms-0">*</span></label>
                                                {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-floating">
                                                <input className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} id="email" name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleInputChange} required />
                                                <label htmlFor="email">Email address<span className="text-danger ms-0">*</span></label>
                                                {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-floating mb-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="videoURL"
                                            name="videoURL"
                                            placeholder="Enter video or feedback URL"
                                            value={formData.videoURL || ''}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="videoURL">Video or Demo URL<span className="text-danger ms-0">*</span></label>
                                        {formErrors.videoURL && <div className="invalid-feedback">{formErrors.videoURL}</div>}
                                    </div>

                                    {/* Conditionally render the video player if a videoURL is provided */}
                                    {formData.videoURL && (
                                        <div className="video-section mb-4">
                                            <div className="ratio ratio-16x9">
                                                {formData.videoURL.includes('youtube.com') || formData.videoURL.includes('youtu.be') ? (
                                                    <iframe
                                                        className="rounded review-video"
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${extractYouTubeID(formData.videoURL)}`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                ) : formData.videoURL.includes('onepgr.com') ? (
                                                    <iframe
                                                        className="rounded review-video"
                                                        width="100%"
                                                        height="100%"
                                                        src={formData.videoURL}
                                                        title="OnePGR video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                ) : (
                                                    <video
                                                        controls
                                                        className="rounded review-video"
                                                        src={formData.videoURL}
                                                        onError={() => toast.error('Invalid video URL. Please check the URL and try again.')}
                                                        autoPlay
                                                        preload="auto"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Feedback Text Area */}
                                    <div className="form-floating mb-4">
                                        <textarea
                                            className={`form-control custom-textarea ${formErrors.feedback ? 'is-invalid' : ''}`}
                                            id="feedback"
                                            name="feedback"
                                            placeholder="Enter your feedback"
                                            value={formData.feedback}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <label htmlFor="feedback" className="feedback-label">
                                            What are your views on this video?<span className="text-danger ms-0">*</span>
                                        </label>
                                        {formErrors.feedback && <div className="invalid-feedback">{formErrors.feedback}</div>}
                                    </div>

                                    {/* Video Recording Section */}
                                    <div className="card bg-light mb-4 recording-section">
                                        <div className="card-body">
                                            <p className="lead recording-title">Record a quick video to share your comments and feedback</p>
                                            <video
                                                ref={videoRef}
                                                className="w-100 mb-3 recording-preview"
                                                style={{ display: 'none' }}
                                                autoPlay
                                                muted
                                            />

                                            <div className="recording-controls">
                                                {isRecording ? (
                                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <span className="badge bg-danger recording-timer">
                                                            {formatTime(elapsedTime)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-hover stop-button"
                                                            onClick={stopRecording}
                                                        >
                                                            Stop Recording
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-hover start-button"
                                                            onClick={startRecording}
                                                            disabled={isRecording}
                                                        >
                                                            <CameraVideoFill className="me-2" />
                                                            Start Recording
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {recordingSuccess && (
                                                <div className="alert alert-success mt-3" role="alert">
                                                    Video recorded successfully!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Confirmation Checkbox */}
                                    <div className="form-check mb-4 email-confirmation">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="sendConfirmationEmail"
                                            name="sendConfirmationEmail"
                                            checked={formData.sendConfirmationEmail}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label" htmlFor="sendConfirmationEmail">
                                            Receive an email with a summary of this feedback
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="text-end submit-section">
                                        <button
                                            type="submit"
                                            className="btn btn-success btn-hover-effect submit-button"
                                        >
                                            Submit Feedback
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Spinner */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loader-container">
                        <div className="circle-loader"></div>
                    </div>
                </div>
            )}

            <ToastContainer position={isMobile ? "bottom-center" : "top-right"} />
        </div>
    );
};

export default VideoFeedback;
