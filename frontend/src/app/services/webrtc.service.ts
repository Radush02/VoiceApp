import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { SignalMessage } from '../models/signal-message.model';
import { AuthenticationService } from './authentication.service';

@Injectable({ providedIn: 'root' })
export class WebrtcService {
  private channelId = '';
  private userId = '';
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peers = new Map<string, { pc: RTCPeerConnection; pendingCandidates: RTCIceCandidateInit[] }>();
  public localVideoEl!: HTMLVideoElement;
  public onRemoteStream!: (peerId: string, stream: MediaStream) => void;
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  constructor(
    private ws: WebsocketService,
    private auth: AuthenticationService
  ) {
    this.auth.getUsername().subscribe(id => this.userId = id);
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
          (msg: SignalMessage & { from: string; to?: string }) => this.handleSignal(msg)
        );

        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          this.localVideoEl.srcObject = this.localStream;
          this.sendSignal({ type: 'join', from: this.userId, payload: null });
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
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.localVideoEl.srcObject = this.localStream!;
                this.sendSignal({ type: 'join', from: this.userId, payload: null });
        resolve();
      } catch (err) {
        console.error('>>> [WebrtcService] initAsInitiator: getUserMedia failed', err);
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
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.localVideoEl.srcObject = this.localStream!;
                this.sendSignal({ type: 'join', from: this.userId, payload: null });
        resolve();
      } catch (err) {
        console.error('>>> [WebrtcService] initAsJoiner: getUserMedia failed', err);
        reject(err);
      }
    });
  });
}



  private async handleSignal(msg: SignalMessage & { from: string; to?: string }) {
    const { type, from, to, payload } = msg;
  if (from === this.userId) {
    return;
  }
  if (to && to !== this.userId) {
    return;
  }

  switch (type) {
    case 'join':
            if (!this.peers.has(from)) {
        await this.createPeerConnection(from,  true);
      }
      break;

    case 'offer':
            await this.setupIncomingConnection(from, payload as RTCSessionDescriptionInit);
      break;

    case 'answer':
            await this.setRemoteDescription(from, payload as RTCSessionDescriptionInit);
      break;

    case 'candidate':
            this.handleIceCandidate(from, payload as RTCIceCandidateInit);
      break;

    case 'leave':
      this.removePeer(from);
      break;

    default:
      
  }
}


  private async createPeerConnection(peerId: string, isInitiator: boolean) {
    const pc = new RTCPeerConnection(this.rtcConfig);
  const pendingCandidates: RTCIceCandidateInit[] = [];

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
            this.sendSignal({
        type: 'candidate',
        from: this.userId,
        to: peerId,
        payload: candidate,
      });
    }
  };

  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
        remoteStream.addTrack(event.track);
    this.onRemoteStream(peerId, remoteStream);
  };

  if (this.localStream) {
    this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
  }

  this.peers.set(peerId, { pc, pendingCandidates });

  if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal({
      type: 'offer',
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

  await pc.setRemoteDescription(new RTCSessionDescription(offer));

    for (const c of pendingCandidates) {
    try {
      await pc.addIceCandidate(c);
          } catch {
      
    }
  }
  pendingCandidates.length = 0;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.sendSignal({
    type: 'answer',
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
          } catch {
      
    }
  }
  entry.pendingCandidates.length = 0;
}

private handleIceCandidate(peerId: string, candidateInit: RTCIceCandidateInit) {
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
        pc
      .addIceCandidate(new RTCIceCandidate(candidateInit))
      .catch(err => console.log(err) );
  }
}


  private removePeer(peerId: string) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.pc.close();
    this.peers.delete(peerId);
  }

  public endCall() {
    this.sendSignal({ type: 'leave', from: this.userId, payload: null });
    this.peers.forEach(({ pc }) => pc.close());
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.localVideoEl) {
      this.localVideoEl.srcObject = null;
    }
  }

  public async startScreenShare(): Promise<void> {
    if (!this.localStream) return;
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = this.screenStream.getVideoTracks()[0];
    this.peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
    });
    this.localVideoEl.srcObject = this.screenStream;
    screenTrack.onended = () => this.stopScreenShare();
  }

  public stopScreenShare(): void {
    if (!this.screenStream || !this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    this.peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    this.localVideoEl.srcObject = this.localStream;
    this.screenStream.getTracks().forEach(t => t.stop());
    this.screenStream = null;
  }

  public toggleMic(): void {
    this.localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  }

  public toggleCamera(): void {
    this.localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);
  }

  private sendSignal(signal: any) {
    this.ws.sendSignal(this.channelId, signal);
  }
  
}
