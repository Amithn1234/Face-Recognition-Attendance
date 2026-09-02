import api from './api';

export const faceService = {
  registerFace: async (studentId, imageBase64) => {
    const response = await api.post('/face/register', {
      student_id: studentId,
      image_base64: imageBase64
    });
    return response.data;
  },

  recognizeFace: async (imageBase64, markAttendance = true) => {
    const response = await api.post('/face/recognize', {
      image_base64: imageBase64,
      mark_attendance: markAttendance
    });
    return response.data;
  }
};
