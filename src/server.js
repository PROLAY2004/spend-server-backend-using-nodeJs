import express from 'express';
import cors from 'cors';

import configuration from './config/config.js';
import errorHandler from './error/errorHandler.js';
import loggerMiddleware from './validations/middleware/loggerMiddleware.js';
import connectDB from './config/dbConfig.js';
import TokenValidation from './validations/middleware/TokenValidation.js';

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();
const token = new TokenValidation();

await connectDB();

app.use(cors(configuration.CORS));

app.use(express.json());
app.use(loggerMiddleware);

app.use('/user/auth', authRoutes);
app.use('/user/dashboard', token.accessTokenValidator, dashboardRoutes);
app.use('/user', userRoutes);

app.use(errorHandler);

app.listen(configuration.PORT, () => {
  console.log(`spendServer listening on port ${configuration.PORT}`);
});
