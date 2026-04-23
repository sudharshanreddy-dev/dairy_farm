import { Request, Response } from "express";
import { prisma } from "../db";
export const listPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true } } }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.communityPost.findUnique({
      where: { id: Number(id) },
      include: { comments: { orderBy: { createdAt: 'asc' } } }
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, category } = req.body;
    const post = await prisma.communityPost.create({
      data: {
        title,
        content,
        category,
        author: req.user!.fullName || req.user!.username || 'Anonymous'
      }
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const comment = await prisma.communityComment.create({
      data: {
        postId: Number(postId),
        content,
        author: req.user!.fullName || req.user!.username || 'Anonymous'
      }
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
