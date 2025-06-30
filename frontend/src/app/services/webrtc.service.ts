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
    { 
      pc: RTCPeerConnection; 
      pendingCandidates: RTCIceCandidateInit[];
      reconnectAttempts: number;
      lastConnectionState: RTCIceConnectionState;
      disconnectTimer?: number;
      reconnectTimer?: number;
    }
  >();
  private pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();
  private reofferTimers = new Map<string, any>();
  private isNegotiating = false;
  private forceRelay = false;
  private readonly maxReconnectAttempts = 5;
  private readonly disconnectTimeout = 10000;
  private readonly reconnectDelay = 2000;
  public localVideoEl!: HTMLVideoElement;
  public onRemoteStream!: (peerId: string, stream: MediaStream) => void;
  public onPeerLeave!: (peerId: string) => void;
  public onConnectionStateChange?: (peerId: string, state: RTCIceConnectionState, isReconnecting: boolean) => void;
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
    onRemoteStream: (peerId: string, stream: MediaStream) => void,
    onPeerLeave?: (peerId: string) => void,
    onConnectionStateChange?: (peerId: string, state: RTCIceConnectionState, isReconnecting: boolean) => void
  ): Promise<void> {
    console.log("=== WebRTC initAsInitiator Debug ===");
    console.log("Channel:", channel);
    console.log("LocalVideo element:", localVideo);
    console.log("UserId:", this.userId);
    
    this.channelId = channel;
    this.localVideoEl = localVideo;
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeave = onPeerLeave || (() => {});
    this.onConnectionStateChange = onConnectionStateChange;
    this.localVideoEl.muted = true;

    return new Promise<void>((resolve, reject) => {
      this.ws.onConnect(async () => {
        console.log("WebSocket connected, subscribing to signal channel:", `/channel/${this.channelId}/signal`);
        this.ws.subscribeToChannel(
          `/channel/${this.channelId}/signal`,
          (msg: any) => {
            console.log("Signal message received:", msg);
            this.handleSignal(msg);
          }
        );

        try {
          console.log("Enumerating media devices...");
          const devices = await navigator.mediaDevices.enumerateDevices();
          console.log("Available devices:", devices);
          const hasInput = devices.some((d) => d.kind === "audioinput" || d.kind === "videoinput");
          if (!hasInput) {
            throw new Error("No media devices available");
          }
          console.log("Getting user media...");
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log("Local stream obtained:", this.localStream);
          this.localVideoEl.srcObject = this.localStream!;
          console.log("Sending join signal...");
          this.sendSignal({ type: "join", from: this.userId, payload: null });
          console.log("=== WebRTC initAsInitiator Success ===");
          resolve();
        } catch (err) {
          console.error("=== WebRTC initAsInitiator Error ===", err);
          reject(err);
        }
      });
    });
  }

  public async initAsJoiner(
    channel: string,
    localVideo: HTMLVideoElement,
    onRemoteStream: (peerId: string, stream: MediaStream) => void,
    onPeerLeave?: (peerId: string) => void,
    onConnectionStateChange?: (peerId: string, state: RTCIceConnectionState, isReconnecting: boolean) => void
  ): Promise<void> {
    console.log("=== WebRTC initAsJoiner Debug ===");
    console.log("Channel:", channel);
    console.log("LocalVideo element:", localVideo);
    console.log("UserId:", this.userId);
    
    this.channelId = channel;
    this.localVideoEl = localVideo;
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeave = onPeerLeave || (() => {});
    this.onConnectionStateChange = onConnectionStateChange;
    this.localVideoEl.muted = true;

    return new Promise<void>((resolve, reject) => {
      this.ws.onConnect(async () => {
        console.log("WebSocket connected, subscribing to signal channel:", `/channel/${this.channelId}/signal`);
        this.ws.subscribeToChannel(
          `/channel/${this.channelId}/signal`,
          (msg: any) => {
            console.log("Signal message received:", msg);
            this.handleSignal(msg);
          }
        );

        try {
          console.log("Enumerating media devices...");
          const devices = await navigator.mediaDevices.enumerateDevices();
          console.log("Available devices:", devices);
          const hasInput = devices.some((d) => d.kind === "audioinput" || d.kind === "videoinput");
          if (!hasInput) {
            throw new Error("No media devices available");
          }
          console.log("Getting user media...");
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log("Local stream obtained:", this.localStream);
          this.localVideoEl.srcObject = this.localStream!;
          console.log("Sending join signal...");
          this.sendSignal({ type: "join", from: this.userId, payload: null });
          console.log("=== WebRTC initAsJoiner Success ===");
          resolve();
        } catch (err) {
          console.error("=== WebRTC initAsJoiner Error ===", err);
          reject(err);
        }
      });
    });
  }

  private async handleSignal(
    msg: SignalMessage & { from: string; to?: string }
  ) {
    console.log("=== handleSignal Debug ===");
    console.log("Signal received:", msg);
    console.log("Current userId:", this.userId);
    console.log("Current peers:", Array.from(this.peers.keys()));
    
    const { type, from, to, payload } = msg;
    if (from === this.userId) {
      console.log("Ignoring signal from self");
      return;
    }
    if (to && to !== this.userId) {
      console.log("Ignoring signal not meant for us (to:", to, ", we are:", this.userId, ")");
      return;
    }

    console.log("Processing signal type:", type, "from:", from);

    switch (type) {
      case "join":
        console.log("Handling join signal from:", from);
        if (!this.peers.has(from)) {
          console.log("Creating peer connection for:", from, "as initiator: true");
          await this.createPeerConnection(from, true);
        } else {
          console.log("Peer connection already exists for:", from);
        }
        break;
      case "offer":
        console.log("Handling offer from:", from);
        await this.setupIncomingConnection(
          from,
          payload as RTCSessionDescriptionInit
        );
        break;

      case "answer":
        console.log("Handling answer from:", from);
        await this.setRemoteDescription(
          from,
          payload as RTCSessionDescriptionInit
        );
        break;

      case "candidate":
        console.log("Handling ICE candidate from:", from);
        this.handleIceCandidate(from, payload as RTCIceCandidateInit);
        break;

      case "leave":
        console.log("Handling leave from:", from);
        this.removePeer(from);
        if (this.onPeerLeave) {
          this.onPeerLeave(from);
        }
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
      const peerEntry = this.peers.get(peerId);
      if (!peerEntry) return;
      if (peerEntry.disconnectTimer) {
        clearTimeout(peerEntry.disconnectTimer);
        peerEntry.disconnectTimer = undefined;
      }
      if (peerEntry.reconnectTimer) {
        clearTimeout(peerEntry.reconnectTimer);
        peerEntry.reconnectTimer = undefined;
      }
      peerEntry.lastConnectionState = state;
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(peerId, state, peerEntry.reconnectAttempts > 0);
      }

      console.log(`ICE connection state for ${peerId}: ${state} (attempts: ${peerEntry.reconnectAttempts})`);

      switch (state) {
        case "failed":
          this.handleConnectionFailed(peerId);
          break;
        case "disconnected":
          this.handleConnectionDisconnected(peerId);
          break;
        case "connected":
        case "completed":
          peerEntry.reconnectAttempts = 0;
          console.log(`Connection restored for ${peerId}`);
          break;
        case "checking":
          console.log(`Reconnection in progress for ${peerId}`);
          break;
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.onended = () => this.handleDeviceChange();
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peers.set(peerId, { 
      pc, 
      pendingCandidates,
      reconnectAttempts: 0,
      lastConnectionState: 'new' as RTCIceConnectionState
    });

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
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
    }
    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer);
    }
    
    entry.pc.close();
    this.peers.delete(peerId);
    this.pendingIceCandidates.delete(peerId);
    
    const timer = this.reofferTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.reofferTimers.delete(peerId);
    }
    
    console.log(`Peer ${peerId} removed and cleaned up`);
  }

  public endCall() {
    this.sendSignal({ type: "leave", from: this.userId, payload: null });
    this.peers.forEach((entry, peerId) => {
      if (entry.disconnectTimer) {
        clearTimeout(entry.disconnectTimer);
      }
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
      }
      entry.pc.close();
    });
    
    this.peers.clear();
    this.reofferTimers.forEach(timer => clearTimeout(timer));
    this.reofferTimers.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = null;
    }
    
    console.log('Call ended and all resources cleaned up');
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

private handleConnectionFailed(peerId: string): void {
    const peerEntry = this.peers.get(peerId);
    if (!peerEntry) return;

    console.log(`Connection failed for ${peerId}, attempting ICE restart...`);
    
    try {
      peerEntry.pc.restartIce();
      this.forceRelay = true;
      peerEntry.reconnectAttempts++;
    } catch (error) {
      console.error(`Failed to restart ICE for ${peerId}:`, error);
      this.attemptReconnection(peerId);
    }
  }

  private handleConnectionDisconnected(peerId: string): void {
    const peerEntry = this.peers.get(peerId);
    if (!peerEntry) return;

    console.log(`Connection disconnected for ${peerId}, waiting ${this.disconnectTimeout}ms before removal...`);
    peerEntry.disconnectTimer = setTimeout(() => {
      const currentEntry = this.peers.get(peerId);
      if (currentEntry && currentEntry.pc.iceConnectionState === "disconnected") {
        if (currentEntry.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting reconnection for ${peerId} (attempt ${currentEntry.reconnectAttempts + 1})`);
          this.attemptReconnection(peerId);
        } else {
          console.log(`Max reconnection attempts reached for ${peerId}, removing peer`);
          this.removePeer(peerId);
          if (this.onPeerLeave) {
            this.onPeerLeave(peerId);
          }
        }
      }
    }, this.disconnectTimeout) as any;
  }

  private attemptReconnection(peerId: string): void {
    const peerEntry = this.peers.get(peerId);
    if (!peerEntry || peerEntry.reconnectAttempts >= this.maxReconnectAttempts) {
      if (peerEntry && peerEntry.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`Max reconnection attempts reached for ${peerId}`);
        this.removePeer(peerId);
        if (this.onPeerLeave) {
          this.onPeerLeave(peerId);
        }
      }
      return;
    }

    peerEntry.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, peerEntry.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection for ${peerId} in ${delay}ms (attempt ${peerEntry.reconnectAttempts})`);

    peerEntry.reconnectTimer = setTimeout(async () => {
      try {
        peerEntry.pc.close();
        console.log(`Creating new peer connection for ${peerId} (reconnection attempt ${peerEntry.reconnectAttempts})`);
        await this.createPeerConnection(peerId, true);
        
        console.log(`Reconnection initiated for ${peerId}`);
      } catch (error) {
        console.error(`Reconnection failed for ${peerId}:`, error);
        
        if (peerEntry.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.attemptReconnection(peerId), delay);
        } else {
          this.removePeer(peerId);
          if (this.onPeerLeave) {
            this.onPeerLeave(peerId);
          }
        }
      }
    }, delay) as any;
  }

  public getConnectionStatus(): Map<string, { state: RTCIceConnectionState, reconnectAttempts: number, isReconnecting: boolean }> {
    const status = new Map();
    this.peers.forEach((entry, peerId) => {
      status.set(peerId, {
        state: entry.lastConnectionState,
        reconnectAttempts: entry.reconnectAttempts,
        isReconnecting: entry.reconnectAttempts > 0 && entry.lastConnectionState !== 'connected' && entry.lastConnectionState !== 'completed'
      });
    });
    return status;
  }

  public forceReconnectPeer(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) {
      console.warn(`Cannot reconnect peer ${peerId}: not found`);
      return;
    }
    
    console.log(`Force reconnecting peer ${peerId}`);
    this.attemptReconnection(peerId);
  }

  public forceReconnectAll(): void {
    console.log('Force reconnecting all peers');
    this.peers.forEach((_, peerId) => {
      this.forceReconnectPeer(peerId);
    });
  }

}
