export default {
  bundles: {
    main: "src/**/*",
  },

  upload: {
    provider: "gdrive",
    clientId: process.env.GDRIVE_CLIENT_ID,
    clientSecret: process.env.GDRIVE_CLIENT_SECRET,
    folderId: process.env.GDRIVE_FOLDER_ID,
  },
};
