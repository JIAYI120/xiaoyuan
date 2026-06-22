const InteractionNotification = require('../models/InteractionNotification');

async function createInteractionNotification({ recipient, actor, type, post = null, comment = null, content = '' }) {
  if (!recipient || !actor || !type) {
    return null;
  }

  if (String(recipient) === String(actor)) {
    return null;
  }

  const notification = new InteractionNotification({
    recipient,
    actor,
    type,
    post,
    comment,
    content,
    isRead: false,
  });

  await notification.save();
  return notification;
}

async function deleteInteractionNotification({ recipient, actor, type, post = null, comment = null }) {
  if (!recipient || !actor || !type) {
    return null;
  }

  const query = {
    recipient,
    actor,
    type,
  };

  if (comment) {
    query.comment = comment;
  } else if (post) {
    query.post = post;
  }

  return InteractionNotification.findOneAndDelete(query).sort({ createdAt: -1 });
}

module.exports = {
  createInteractionNotification,
  deleteInteractionNotification,
};
