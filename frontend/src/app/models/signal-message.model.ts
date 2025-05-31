export interface SignalMessage {
    type: 'join' | 'offer' | 'answer' | 'candidate' | 'end' | 'leave';
    from: string;
    payload: any;
  }