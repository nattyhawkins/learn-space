import { Unauthorised } from '../config/errors.js'
import { findGroup, findPost, sendErrors, findComment } from '../config/helpers.js'
import Group from '../models/group.js'

//POST GROUP
export const addGroup = async (req, res) => {
  try {
    const newOwnedGroup = { ...req.body, owner: req.currentUser._id }
    const newGroup = await Group.create(newOwnedGroup)
    console.log(newGroup)
    res.status(201).json(newGroup)
  } catch (err) {
    sendErrors(res, err)
  }
}

//GET ALL GROUPS
export const getAllGroups = async (req, res) => {
  let filteredGroups
  try {
    const allGroups = await Group.find({}).populate('owner')
    if (req.query.search) {
      filteredGroups = allGroups.filter(group => group.name.toLowerCase().includes(req.query.search.toLowerCase()))
    }
    console.log('filtered', filteredGroups)
    const groupMap = filteredGroups ? filteredGroups.map(group => group.name) : []
    console.log('is this it?', groupMap)
    const filter = groupMap.length > 0 ? { name: groupMap } : {}
    const groups = await Group.find(filter, null, { skip: req.query.skip, limit: req.query.limit }).populate('owner')
    return res.json(groups)
  } catch (err) {
    sendErrors(res, err)
  }
}

//GET 1 GROUP
// ? NEED TO ADD comments.owner TO POPULATE comment owners
export const getSingleGroup = async (req, res) => {
  try {
    const group = await findGroup(req, res, ['owner', 'posts.owner', 'posts.comments.owner'])
    return res.json(group)
  } catch (err) {
    sendErrors(res, err)
  }
}

export const updateGroup = async (req, res) => {
  try {
    const targetGroup = await findGroup(req, res)
    if (targetGroup && targetGroup.owner.equals(req.currentUser._id)) {
      Object.assign(targetGroup, req.body)
      targetGroup.save()
      return res.status(202).json(targetGroup)
    }
    throw new Unauthorised()
  } catch (err) {
    sendErrors(res, err)
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const targetGroup = await findGroup(req, res)
    if (targetGroup && targetGroup.owner.equals(req.currentUser._id)) {
      await targetGroup.remove()
      console.log('removed')
      return res.sendStatus(204)
    }
    throw new Unauthorised()
  } catch (err) {
    sendErrors(res, err)
  }
}

//Add post
export const addPost = async (req, res) => {
  try {
    const group = await findGroup(req, res, ['owner'])
    if (group) {
      const ownedPost = { ...req.body, owner: req.currentUser._id }
      group.posts.push(ownedPost)
      await group.save()
      return res.json(ownedPost)
    }
  } catch (err) {
    sendErrors(res, err)
  }
}
//delete post
export const deletePost = async (req, res) => {
  try {
    //below returns an object
    const postObject = await findPost(req, res)
    const { post, group } = postObject
    if (post && post.owner.equals(req.currentUser._id)) {
      await post.remove()
      await group.save()
      return res.sendStatus(204)
    }
  } catch (err) {
    sendErrors(res, err)
  }
}


// // get single post
// export const getSinglePost = async (req, res) => {
//   try {
//     const post = await findPost(req, res, ['owner', 'posts.owner'])
//     return res.json(post)
//   } catch (err) {
//     sendErrors(res, err)
//   }
// }


// update post
export const updatePost = async (req, res) => {
  try {
    const postObject = await findPost(req, res)
    const { post, group } = postObject
    console.log('🚗 update post', post)
    if (post && post.owner.equals(req.currentUser._id)) {
      Object.assign(post, req.body)
      group.save()
      return res.status(202).json(post)
    }
    throw new Unauthorised()
  } catch (err) {
    sendErrors(res, err)
  }
}


export const addComment = async (req, res) => {
  try {
    const postObject = await findPost(req, res, ['owner'])
    const { post, group } = postObject
    if (post) {
      const ownedComment = { ...req.body, owner: req.currentUser._id }
      post.comments.push(ownedComment)
      await group.save()
      return res.json(ownedComment)
    }
  } catch (err) {
    sendErrors(res, err)
  }
}


export const deleteComment = async (req, res) => {
  try {
    const commentObject = await findComment(req, res)
    const { comment, group } = commentObject
    if (!req.currentUser.equals(comment.owner)) throw new Unauthorised()
    await comment.remove()
    await group.save()
    return res.sendStatus(204)
  } catch (err) {
    sendErrors(res, err)
  }
}

export const updateComment = async (req, res) => {
  try {
    const commentObject = await findComment(req, res)
    const { comment, group } = commentObject
    if (comment && comment.owner.equals(req.currentUser._id)) {
      Object.assign(comment, req.body)
      group.save()
      return res.status(202).json(comment)
    }
    throw new Unauthorised()
  } catch (err) {
    sendErrors(res, err)
  }
}

// handles both liking and unliking of post
export const likePost = async (req, res) => {
  try {
    const postObject = await findPost(req, res)
    const { post, group } = postObject
    console.log('🚗 Liking post', post)
    if (post) {
      const existingLike = post.likes.find(like => like.owner.equals(req.currentUser._id))
      if (existingLike) {
        await existingLike.remove()
        await group.save()
        return res.sendStatus(204)
      }
      const ownedLike = { ...req.body, owner: req.currentUser._id }
      post.likes.push(ownedLike)
      await group.save()
      return res.json(ownedLike)
    }
  } catch (err) {
    sendErrors(res, err)
  }
}

//handles both liking and unliking of comment depending if owner already exists in likes array
export const likeComment = async (req, res) => {
  try {
    const commentObject = await findComment(req, res)
    const { comment, group } = commentObject
    console.log('🚗 Liking comment', comment)
    if (comment) {
      const existingLike = comment.likes.find(like => like.owner.equals(req.currentUser._id))
      if (existingLike) {
        await existingLike.remove()
        await group.save()
        return res.sendStatus(204)
      }
      const ownedLike = { ...req.body, owner: req.currentUser._id }
      comment.likes.push(ownedLike)
      await group.save()
      return res.json(ownedLike)
    }
  } catch (err) {
    sendErrors(res, err)
  }
}
