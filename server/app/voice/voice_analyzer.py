import speech_recognition as sr
import librosa
import numpy as np
from textblob import TextBlob

class VoiceAnalyzer:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def transcribe_audio(self, audio_file):
        with sr.AudioFile(audio_file) as source:
            audio = self.recognizer.record(source)
            try:
                text = self.recognizer.recognize_google(audio)
                return text
            except sr.UnknownValueError:
                return "Could not understand the audio."
            except sr.RequestError:
                return "Speech recognition service failed."

    def analyze_audio(self, audio_file):
        y, sr_ = librosa.load(audio_file)
        rms = np.sqrt(np.mean(y**2))
        clarity_score = "Clear" if rms > 0.1 else "Low clarity"

        transcription = self.transcribe_audio(audio_file)
        sentiment_label = "N/A"
        if "Could not" not in transcription:
            sentiment = TextBlob(transcription).sentiment.polarity
            sentiment_label = "Positive" if sentiment > 0 else "Negative" if sentiment < 0 else "Neutral"

        return {
            "clarity": clarity_score,
            "transcription": transcription,
            "sentiment": sentiment_label
        }
