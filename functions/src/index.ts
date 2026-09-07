import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import './config/firebase';
import healthRoutes from './routes/health.routes';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/v1', healthRoutes);

export const api = functions.https.onRequest(app);
