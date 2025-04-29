
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