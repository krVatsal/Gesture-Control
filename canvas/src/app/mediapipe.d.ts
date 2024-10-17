declare module '@mediapipe/tasks-vision' {
    export const FilesetResolver: {
      forVisionTasks: (url: string) => Promise<any>;
    };
    export const GestureRecognizer: {
      createFromModelPath: (
        vision: any,
        modelPath: string
      ) => Promise<any>;
    };
  }
  