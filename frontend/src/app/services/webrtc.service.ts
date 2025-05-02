import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { AuthenticationService } from './authentication.service';
import { BehaviorSubject } from 'rxjs';
import { SignalMessage } from '../models/signal-message.model';
@Injectable({ providedIn: 'root' })
export class WebrtcService {
  private selfId!: string;
  private pcs = new Map<string, RTCPeerConnection>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private localStream!: MediaStream;
  private channel!: string;
  private localVideoEl!: HTMLVideoElement;
  private remoteVideoEl!: HTMLVideoElement;

  constructor(
    private ws: WebsocketService,
    private auth: AuthenticationService
  ) {
    this.auth.getUsername().subscribe(name => {
      this.selfId = name;
    });
  }
  public cameraOn = new BehaviorSubject<boolean>(false);
  public micOn    = new BehaviorSubject<boolean>(true);
  public async init(
    channel: string,
    localVid: HTMLVideoElement,
    remoteVid: HTMLVideoElement
  ): Promise<void> {
    this.channel = channel;
    this.localVideoEl = localVid;
    this.remoteVideoEl = remoteVid;
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getVideoTracks().forEach(t => t.enabled = false);
    this.cameraOn.next(false);

    this.localStream.getAudioTracks().forEach(t => t.enabled = true);
    this.micOn.next(true);
    this.localVideoEl.srcObject = this.localStream;
    this.ws.subscribeToSignal(channel, (msg: SignalMessage) => this.onSignal(msg));
    this.ws.sendSignal(channel, { type: 'join', from: this.selfId, payload: null });
  }

  private async onSignal(msg: SignalMessage) {
    const { type, from, payload } = msg;
    if (from === this.selfId) return;

    let pc = this.pcs.get(from);
    if (!pc) {
      pc = this.createPeerConnection(from);
      this.pcs.set(from, pc);
      this.localStream.getTracks().forEach(track => pc!.addTrack(track, this.localStream));
    }

    switch (type) {
      case 'join':
        if (this.selfId.localeCompare(from) < 0) {
          await this.createOffer(from);
        }
        break;

      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        await this.flushPendingCandidates(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.ws.sendSignal(this.channel, { type: 'answer', from: this.selfId, payload: answer });
        break;

      case 'answer':
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await this.flushPendingCandidates(from);
        }
        break;

      case 'candidate':
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        } else {
          const queue = this.pendingCandidates.get(from) || [];
          queue.push(payload);
          this.pendingCandidates.set(from, queue);
        }
        break;
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = evt => {
      if (evt.candidate) {
        this.ws.sendSignal(this.channel, {
          type: 'candidate',
          from: this.selfId,
          payload: evt.candidate.toJSON()
        });
      }
    };

    pc.ontrack = evt => {
      this.remoteVideoEl.srcObject = evt.streams[0];
    };

    return pc;
  }

  private async createOffer(peerId: string) {
    const pc = this.pcs.get(peerId)!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.ws.sendSignal(this.channel, { type: 'offer', from: this.selfId, payload: offer });
  }

  private async flushPendingCandidates(from: string) {
    const pc = this.pcs.get(from)!;
    const queued = this.pendingCandidates.get(from) || [];
    for (const c of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    this.pendingCandidates.delete(from);
  }
  public toggleCamera() {
    if (!this.localStream) return;
    const newState = !this.cameraOn.value;
    this.localStream.getVideoTracks().forEach(t => t.enabled = newState);
    this.cameraOn.next(newState);
  }
  public toggleMic() {
    if (!this.localStream) return;
    const newState = !this.micOn.value;
    this.localStream.getAudioTracks().forEach(t => t.enabled = newState);
    this.micOn.next(newState);
  }
}
