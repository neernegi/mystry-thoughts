// export interface ApiResponse {
//     success: boolean;
//     message: string;
//     data?: any;
// }



export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}