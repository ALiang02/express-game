module.exports.idGenerate = function (type) {
  let count = 0
  switch (type) {
    case 'user':
      break
    case 'room':
      count = 3000
      break
    case 'qipan':
      count = 6000
      break
  }

  const time = new Date()
  const month = time.getMonth() + 1 + ''
  const date = time.getDate() + ''
  const random_id = Math.floor(3000 * (Math.random())) + count + ''
  return month.padStart(2, '0') + date + random_id.padStart(4, '0')
}
