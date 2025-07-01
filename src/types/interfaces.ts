// import { IMatch } from "@/model/userMatch";



// profile interfaces
export interface ProfileData {
  user: User;
  thoughts: Thought[];
  confessions: Confession[];
  isOwner: boolean;
}



export interface User {
  _id: string;
  username: string;
  email?: string;
  image?: string;
  gender?: string;
  anonymousName?: string;
  createdAt?: string;
  avatarOptions?: { 
    avatarStyle: string;
    topType: string;
    accessoriesType: string;
    hairColor: string;
    facialHairType: string;
    facialHairColor: string;
    clotheType: string;
    colorFabric: string;
    eyeType: string;
    eyebrowType: string;
    mouthType: string;
    skinColor: string;
  };
}

export interface AvatarOptions {
  avatarStyle?: string;
  topType?: string;
  accessoriesType?: string;
  hairColor?: string;
  facialHairType?:string;
  facialHairColor?: string;
  clotheType?: string;
  colorFabric?:string;
  eyeType?: string;
  eyebrowType?: string;
  mouthType?: string;
  skinColor?: string;
}

export type ReplyUser = Pick<User, "_id" | "username" | "anonymousName" | "image">;



// Thoughts interface
export interface Thought {
  _id: string;
  user: User;
  thought: string;
  image: string[];
  thoughtReplies: TReply[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}


export interface TReply {
  _id: string;
  user: User;
  reply: string;
  replyOfreplies?: TReply[];
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  _id: string;
  replyConfession: string;
  user: User;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

export interface Confession {
  _id: string;
  user: User;
  confession: string;
  repliesToConfession: Reply[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  __v?: number;
};

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
};





// AI Insight interface

export interface AISlide {
  _id: string;
  slides: Array<{
    title: string;
    type: 'thought' | 'confession';
    keyTerms: Array<{
      heading: string;
      points: string[];
    }>;
    aiFeatures: Array<{
      name: string;
      description: string;
      response: string;
    }>;
  }>;
  thoughtId: {
    content: string;
  };
  confessionId: {
    content: string;
  };
  createdAt: string;
}

export interface SlideContent {
  heading: string;
  bulletPoints: string[];
}

export interface InsightData {
  id: string;
  type: "thought" | "confession";
  originalContent: string;
  slides: SlideContent[];
  timestamp: Date;
}


// Insight History
export interface HistoryItem {
  id: string;
  type: 'thought' | 'confession';
  timestamp: Date;
  preview: string;
  aiSummary: string;
}

// Insight Stats interface
export interface InsightStats {
  totalThoughts: number;
  totalConfessions: number;
  insightsGenerated: number;
  avgEngagement: number;
}


// Match interface


export interface ExistingMatch {
  _id: string;
  chatRoom: ChatRoom;
  user1: User;
  user2: User;
  lastMessage?: {
    content: string;
     sender: User;
    timestamp: string;
  };
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}



export interface MatchResponse {
  success: boolean;
  matches?: ExistingMatch[];
  pendingMatches?: ExistingMatch[];
  message?: string;
}

// export interface MatchFoundResponse {
//   success: boolean;
//   match?: IMatch;
//   chatRoom?: {
//     _id: string;
//   };
//   message?: string;
// }

export interface IMatch {
  _id: string;
  user1: User; // not ObjectId
  user2: User; // not ObjectId
  status: string;
  createdAt: string;
  // ...other fields
}

export interface MatchFoundResponse {
  success: boolean;
  
  message?: string;
  data?: {
    match: IMatch;
    messageRequest?: any; // or the correct type if you have it
    chatRoom?: {
      _id: string;
    };
  };
}

// message request interface

export interface MessageRequest {
  _id: string;
  sender: User;
  recipient: User;
  status: "pending" | "accepted" | "rejected";
  relatedMatch: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: User;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ActiveChat {
  _id: string;
  chatRoomId: string;
  otherUser: User;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  createdAt: string;
  status: string;
}



export interface MessageRequestResponse {
  success: boolean;
  message: string;
  requests: MessageRequest[];
}




// chatroom 
export interface ChatRoom {
  _id: string;
}





// Chat Messsage interface
export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    anonymousName: string;
    image: string;
  };
  timestamp: string;
}




