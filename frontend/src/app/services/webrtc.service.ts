import { Injectable } from "@angular/core";
import { WebsocketService } from "./websocket.service";
import { SignalMessage } from "../models/signal-message.model";
import { AuthenticationService } from "./authentication.service";
import { HttpClient } from '@angular/common/http';
import { environment } from "../environments/environment";
@Injectable({ providedIn: "root" })
export class WebrtcService {
  private channelId = "";
  private userId = "";
  private apiUrl = environment.apiUrl;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peers = new Map<
    string,
    { pc: RTCPeerConnection; pendingCandidates: RTCIceCandidateInit[] }
  >();
  private pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();
  private reofferTimers = new Map<string, any>();
  private isNegotiating = false;
  private forceRelay = false;
  public localVideoEl!: HTMLVideoElement;
  public onRemoteStream!: (peerId: string, stream: MediaStream) => void;
  private readonly rtcConfig: RTCConfiguration = {
  iceServers: []
};

  constructor(
    private ws: WebsocketService,
    private auth: AuthenticationService,
    private http: HttpClient
  ) {
    this.auth.getUsername().subscribe((id) => {
      this.userId = id;
      this.loadTurnServers(id); 
    });
  }


  public async init(
    channel: string,
    localVideo: HTMLVideoElement,
    onRemoteStream: (peerId: string, stream: MediaStream) => void
  ): Promise<void> {
    this.channelId = channel;
    this.localVideoEl = localVideo;
    this.onRemoteStream = onRemoteStream;
    this.localVideoEl.muted = true;

    return new Promise<void>((resolve, reject) => {
      this.ws.onConnect(async () => {
        this.ws.subscribeToChannel(
          `/channel/${this.channelId}/signal`,
          (msg: SignalMessage & { from: string; to?: string }) =>
            this.handleSignal(msg)
        );

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasInput = devices.some((d) => d.kind === "audioinput" || d.kind === "videoinput");
          if (!hasInput) {
            throw new Error("No media devices available");
          }
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          this.localVideoEl.srcObject = this.localStream;
          this.sendSignal({ type: "join", from: this.userId, payload: null });
          resolve();
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
    });
  }
  public async initAsInitiator(
    channel: string,
    localVideo: HTMLVideoElement,
    onRemoteStream: (peerId: string, stream: MediaStream) => void
  ): Promise<void> {
    this.channelId = channel;
    this.localVideoEl = localVideo;
    this.onRemoteStream = onRemoteStream;
    this.localVideoEl.muted = true;

    return new Promise<void>((resolve, reject) => {
      this.ws.onConnect(async () => {
        this.ws.subscribeToChannel(
          `/channel/${this.channelId}/signal`,
          (msg: any) => this.handleSignal(msg)
        );

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasInput = devices.some((d) => d.kind === "audioinput" || d.kind === "videoinput");
          if (!hasInput) {
            throw new Error("No media devices available");
          }
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          this.localVideoEl.srcObject = this.localStream!;
          this.sendSignal({ type: "join", from: this.userId, payload: null });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async initAsJoiner(
    channel: string,
    localVideo: HTMLVideoElement,
    onRemoteStream: (peerId: string, stream: MediaStream) => void
  ): Promise<void> {
    this.channelId = channel;
    this.localVideoEl = localVideo;
    this.onRemoteStream = onRemoteStream;
    this.localVideoEl.muted = true;

    return new Promise<void>((resolve, reject) => {
      this.ws.onConnect(async () => {
        this.ws.subscribeToChannel(
          `/channel/${this.channelId}/signal`,
          (msg: any) => this.handleSignal(msg)
        );

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasInput = devices.some((d) => d.kind === "audioinput" || d.kind === "videoinput");
          if (!hasInput) {
            throw new Error("No media devices available");
          }
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          this.localVideoEl.srcObject = this.localStream!;
          this.sendSignal({ type: "join", from: this.userId, payload: null });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async handleSignal(
    msg: SignalMessage & { from: string; to?: string }
  ) {
    const { type, from, to, payload } = msg;
    if (from === this.userId) {
      return;
    }
    if (to && to !== this.userId) {
      return;
    }

    switch (type) {
      case "join":
        if (!this.peers.has(from)) {
          await this.createPeerConnection(from, true);
        }
        break;
      case "offer":
        await this.setupIncomingConnection(
          from,
          payload as RTCSessionDescriptionInit
        );
        break;

      case "answer":
        await this.setRemoteDescription(
          from,
          payload as RTCSessionDescriptionInit
        );
        break;

      case "candidate":
        this.handleIceCandidate(from, payload as RTCIceCandidateInit);
        break;

      case "leave":
        this.removePeer(from);
        break;
      default:
    }
  }

  private async createPeerConnection(peerId: string, isInitiator: boolean) {
    const config = this.forceRelay
      ? { ...this.rtcConfig, iceTransportPolicy: "relay" as RTCIceTransportPolicy }
      : this.rtcConfig;
    const pc = new RTCPeerConnection(config);
    const pendingCandidates:
      RTCIceCandidateInit[] = this.pendingIceCandidates.get(peerId) || [];
    this.pendingIceCandidates.delete(peerId);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.sendSignal({
          type: "candidate",
          from: this.userId,
          to: peerId,
          payload: candidate,
        });
      }
    };
    pc.onicecandidateerror = (err) => {
      console.error("ICE candidate error", err);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        try {
          pc.restartIce();
        } catch {}
      }
    };

    pc.onnegotiationneeded = async () => {
      if (this.isNegotiating) {
        return;
      }
      this.isNegotiating = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal({
          type: "offer",
          from: this.userId,
          to: peerId,
          payload: offer,
        });
        const timer = setTimeout(() => {
          if (pc.signalingState !== "stable") {
            this.sendSignal({
              type: "offer",
              from: this.userId,
              to: peerId,
              payload: offer,
            });
          }
        }, 5000);
        this.reofferTimers.set(peerId, timer);
      } catch (err) {
        console.error(err);
      } finally {
        this.isNegotiating = false;
      }
    };

    const remoteStream = new MediaStream();
 pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      event.track.onended = () => remoteStream.removeTrack(event.track);
      this.onRemoteStream(peerId, remoteStream);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "failed") {
        try {
          pc.restartIce();
          this.forceRelay = true;
        } catch {}
      } else if (state === "disconnected") {
        setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") {
            this.removePeer(peerId);
          }
        }, 2000);
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.onended = () => this.handleDeviceChange();
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peers.set(peerId, { pc, pendingCandidates });

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal({
        type: "offer",
        from: this.userId,
        to: peerId,
        payload: offer,
      });
    }
  }

  private async setupIncomingConnection(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ) {
    if (!this.peers.has(peerId)) {
      await this.createPeerConnection(peerId, false);
    }
    const entry = this.peers.get(peerId)!;
    const { pc, pendingCandidates } = entry;
    if (pc.signalingState !== "stable") {
      await pc.setLocalDescription({ type: "rollback" } as any);
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    for (const c of pendingCandidates) {
      try {
        await pc.addIceCandidate(c);
      } catch {}
    }
    pendingCandidates.length = 0;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.sendSignal({
      type: "answer",
      from: this.userId,
      to: peerId,
      payload: answer,
    });
  }

  private async setRemoteDescription(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ) {
    const entry = this.peers.get(peerId);
    if (!entry) {
      return;
    }
    await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
    for (const c of entry.pendingCandidates) {
      try {
        await entry.pc.addIceCandidate(c);
      } catch {}
    }
    entry.pendingCandidates.length = 0;
  }

  private handleIceCandidate(
    peerId: string,
    candidateInit: RTCIceCandidateInit
  ) {
    const entry = this.peers.get(peerId);
    if (!entry) {
      const pendingCandidates = this.peers.get(peerId)?.pendingCandidates;
      if (pendingCandidates) pendingCandidates.push(candidateInit);
      return;
    }
    const { pc, pendingCandidates } = entry;
    if (!pc.remoteDescription) {
      pendingCandidates.push(candidateInit);
    } else {
      pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((err) =>
        console.log(err)
      );
    }
  }

  private removePeer(peerId: string) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.pc.close();
    this.peers.delete(peerId);
    this.pendingIceCandidates.delete(peerId);
    const timer = this.reofferTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.reofferTimers.delete(peerId);
    }
  }

  public endCall() {
    this.sendSignal({ type: "leave", from: this.userId, payload: null });
    this.peers.forEach(({ pc }) => pc.close());
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = null;
    }
  }

  public async startScreenShare(): Promise<void> {
    if (!this.localStream) return;
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const screenTrack = this.screenStream.getVideoTracks()[0];
    this.peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
    });
    this.localVideoEl.srcObject = this.screenStream;
    screenTrack.onended = () => this.stopScreenShare();
  }

  public stopScreenShare(): void {
    if (!this.screenStream || !this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    this.peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    });
    this.localVideoEl.srcObject = this.localStream;
    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = null;
  }

  public toggleMic(): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }

public toggleCamera(): boolean {
  if (!this.localStream) return false;

  const videoTrack = this.localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    return videoTrack.enabled;
  }

  return false;
}

public reinitializeLocalVideo(videoElement: HTMLVideoElement): void {
  if (this.localStream && videoElement) {
    this.localVideoEl = videoElement;
    this.localVideoEl.muted = true;
    this.localVideoEl.srcObject = this.localStream;
  }
  }


  private sendSignal(signal: any) {
    this.ws.sendSignal(this.channelId, signal);
  }
 private restartConnections(): void {
    this.forceRelay = true;
    this.peers.forEach(({ pc }) => {
      try {
        pc.restartIce();
      } catch {}
    });
  }

  private async handleDeviceChange(): Promise<void> {
    if (!this.localStream) {
      return;
    }
    try {
      const constraints = {
        video: this.localStream.getVideoTracks().length > 0,
        audio: this.localStream.getAudioTracks().length > 0,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideo = newStream.getVideoTracks()[0];
      const newAudio = newStream.getAudioTracks()[0];

      if (newVideo) {
        this.localStream.getVideoTracks().forEach((t) => t.stop());
        this.localStream.addTrack(newVideo);
        this.peers.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(newVideo);
        });
      }

      if (newAudio) {
        this.localStream.getAudioTracks().forEach((t) => t.stop());
        this.localStream.addTrack(newAudio);
        this.peers.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
          if (sender) sender.replaceTrack(newAudio);
        });
      }
    } catch (err) {
      console.error("Failed to handle device change", err);
    }
  }
  private loadTurnServers(userId: string): void {
  this.http.get<{
    username: string;
    credential: string;
    urls: string[];
  }>(`${this.apiUrl}/turn?userId=${userId}`, { withCredentials: true }).subscribe({
    next: (turn) => {
      this.rtcConfig.iceServers = [
        {
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        },
        { urls: "stun:stun.l.google.com:19302" },
      ];
    },
    error: (err) => {
      console.error("Failed to load TURN credentials", err);
    },
  });
}

}
