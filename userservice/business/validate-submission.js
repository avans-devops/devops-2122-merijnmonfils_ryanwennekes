module.exports = async (target, user, callback) => {
  console.log(target);
  if (target != null) {
    if (target.user._id == user._id) {
      const badRequest = new Error();
      badRequest.status = 400;
      badRequest.message = 'You cannot post submissions under your own target!';

      return callback(badRequest);
    }

    return callback(null);
  }

  const notFound = new Error();
  notFound.status = 400;
  notFound.message = 'The target was not found!';

  return callback(notFound)
}