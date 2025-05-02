export interface SignalMessage {
    type: 'join' | 'offer' | 'answer' | 'candidate';
    from: string;
    payload: any;
  }