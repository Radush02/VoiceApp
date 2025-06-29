
export interface ChannelMembership {
    vanityId: string;
    role: string;
    joinDate: string;
  }
  
  export interface UserDTO {
    imageLink: string;
    username: string;
    status: string;
    aboutMe: string;
    channels: ChannelMembership[];
    friends: string[];
    requests: string[];
  }
  
  export interface PublicUserDTO {
    imageLink: string;
    username: string;
    status: string;
    aboutMe: string;
    friends: string[];
  }
  export interface Channel {
    id: string;
    name: string;
    vanityId: string;
    createdBy: string;
    members: string[];
    imageLink?: string;
  }

  export interface Message{
      id: string;
  sender: string;
  channel?: string;
  recipient?: string;
  content: string;
  attachment?: string;
  date: Date;
  mentions: string[];
  seenBy: string[];
  }

  export interface AdminActionDTO {
    action: string;
    vanityId: string;
    admin: string;
    user: string;
    mutedMinutes?: number;
  }