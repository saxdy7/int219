const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'feedbacks.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function minutesAgo(minutes) {
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  return minutesAgo(minutes);
}

async function readFeedbacks() {
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

async function writeFeedbacks(items) {
  await fs.writeFile(dataFile, JSON.stringify(items, null, 2), 'utf8');
}

app.get('/api/feedbacks', async (_req, res) => {
  try {
    const feedbacks = await readFeedbacks();
    const withRelativeTime = feedbacks.map((item) => ({
      ...item,
      timeAgo: formatRelativeTime(item.createdAt),
    }));
    res.json(withRelativeTime);
  } catch (error) {
    res.status(500).json({ message: 'Could not load feedback data.' });
  }
});

app.post('/api/feedbacks', async (req, res) => {
  try {
    const { category, title, description, rating, priority } = req.body;

    if (!category || !title || !description || !rating || !priority) {
      return res.status(400).json({ message: 'All feedback fields are required.' });
    }

    const score = Number(rating);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const feedbacks = await readFeedbacks();
    const newFeedback = {
      id: Date.now(),
      category,
      title,
      description,
      priority,
      rating: score,
      createdAt: new Date().toISOString(),
    };

    feedbacks.unshift(newFeedback);
    await writeFeedbacks(feedbacks);

    return res.status(201).json({
      ...newFeedback,
      timeAgo: 'just now',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not save feedback.' });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Feedback Hub running at http://localhost:${PORT}`);
});
