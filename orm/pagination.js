const findOffset = async function (pageSize = 5, currentPage = 1, itemCount) {
  try {
    let offset = 0

    if (itemCount === null || itemCount === undefined || itemCount === 0) {
      // (mikekebert) If we aren't given itemCount, then we should assume the requester doesn't know how many items there are
      // because they are asking for their very first batch of data with this sort order.
      // If this is the case, then we can leave the offset at 0
    } else {
      // (mikekebert) We subtract 1 from currentPage so that the offset is set to just before the first item we want to display on the currentPage
      // e.g. in a list of 50 items with a pageSize of 5, the last page would be page 10 and would include items 46-50 and would require an offset of 45
      // which is equal to the pageSize (5) * currentPage - 1 (10 - 1 = 9)
      let position = pageSize * (currentPage - 1)

      // (mikekebert) Make sure we haven't fallen off the end...
      if (position <= itemCount) {
        offset = position
      } else offset = Math.floor(itemCount / pageSize) * pageSize // (mikekebert) If our position has somehow gone past the end of our list, reset to display the last page
    }

    return offset
  } catch (error) {
    console.error('Error finding pagination offset: ', error)
  }
}

module.exports = {
  findOffset,
}
