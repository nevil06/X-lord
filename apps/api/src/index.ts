import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import parcelRoutes from './routes/parcels';
import lineageRoutes from './routes/lineage';
import courtRoutes from './routes/court';
import nriRoutes from './routes/nri';
import mutationRoutes from './routes/mutations';
import fraudRoutes from './routes/fraud';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/parcels', parcelRoutes);
app.use('/api/lineage', lineageRoutes);
app.use('/api/court', courtRoutes);
app.use('/api/nri', nriRoutes);
app.use('/api/mutations', mutationRoutes);
app.use('/api/fraud', fraudRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
