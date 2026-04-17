const feedbackList = document.getElementById('feedbackList');
const form = document.getElementById('feedbackForm');
const formMessage = document.getElementById('formMessage');
const stars = Array.from(document.querySelectorAll('#ratingStars button'));

const selectWrap = document.getElementById('categorySelect');
const selectTrigger = document.getElementById('selectTrigger');
const selectOptions = document.getElementById('selectOptions');
const selectedCategoryLabel = document.getElementById('selectedCategory');

const categoryToTitle = {
  bug: 'Bug',
  feature: 'Feature',
  review: 'Review',
};

let selectedCategory = 'bug';
let selectedRating = 5;

function iconForCategory(category) {
  if (category === 'feature') return '✨';
  if (category === 'review') return '⭐';
  return '🐞';
}

function paintStars(rating) {
  stars.forEach((button) => {
    const isActive = Number(button.dataset.rate) <= rating;
    button.classList.toggle('active', isActive);
  });
}

function starString(rating) {
  return '★'.repeat(rating);
}

function makeCard(item) {
  const template = document.getElementById('feedbackCardTemplate');
  const card = template.content.firstElementChild.cloneNode(true);

  card.querySelector('h3').textContent = `${iconForCategory(item.category)} ${item.title}`;
  card.querySelector('.priority').textContent = item.priority;
  card.querySelector('.desc').textContent = item.description;
  card.querySelector('.time').textContent = item.timeAgo;
  card.querySelector('.stars').textContent = starString(item.rating);

  return card;
}

function renderFeedbacks(items) {
  feedbackList.innerHTML = '';
  items.forEach((item) => {
    feedbackList.appendChild(makeCard(item));
  });
}

async function loadFeedbacks() {
  const response = await fetch('/api/feedbacks');
  const data = await response.json();
  renderFeedbacks(data);
}

function toggleCategoryMenu(forceOpen) {
  const next = typeof forceOpen === 'boolean' ? forceOpen : !selectOptions.classList.contains('open');
  selectOptions.classList.toggle('open', next);
  selectTrigger.setAttribute('aria-expanded', String(next));
}

selectTrigger.addEventListener('click', () => {
  toggleCategoryMenu();
});

selectOptions.addEventListener('click', (event) => {
  const option = event.target.closest('li[data-value]');
  if (!option) return;

  selectedCategory = option.dataset.value;
  selectedCategoryLabel.textContent = option.textContent.trim();
  toggleCategoryMenu(false);
});

document.addEventListener('click', (event) => {
  if (!selectWrap.contains(event.target)) {
    toggleCategoryMenu(false);
  }
});

stars.forEach((button) => {
  button.addEventListener('mouseenter', () => {
    paintStars(Number(button.dataset.rate));
  });

  button.addEventListener('mouseleave', () => {
    paintStars(selectedRating);
  });

  button.addEventListener('click', () => {
    selectedRating = Number(button.dataset.rate);
    paintStars(selectedRating);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    category: selectedCategory,
    title: categoryToTitle[selectedCategory],
    description: document.getElementById('description').value.trim(),
    priority: document.getElementById('priority').value,
    rating: selectedRating,
  };

  if (!payload.description) {
    formMessage.textContent = 'Please add a description before submitting.';
    return;
  }

  const response = await fetch('/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    formMessage.textContent = result.message || 'Could not submit feedback. Try again.';
    return;
  }

  feedbackList.prepend(makeCard(result));
  form.reset();
  selectedCategory = 'bug';
  selectedCategoryLabel.textContent = '🐞 Bug Report';
  selectedRating = 5;
  paintStars(5);
  formMessage.textContent = 'Feedback submitted successfully.';
});

paintStars(selectedRating);
loadFeedbacks().catch(() => {
  formMessage.textContent = 'Unable to load feedback list right now.';
});
