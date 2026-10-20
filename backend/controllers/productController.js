const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true
      }
    });

    res.json(products);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        productId
      },
      include: {
        variants: true
      }
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
};
const createProduct = async (req, res) => {
  try {
    const {
      productId,
      name,
      brand,
      category,
      description,
      status,
      variants
    } = req.body;

    const formattedVariants = Array.isArray(variants)
      ? variants.map((v) => ({
          sku: v.sku,
          color: v.color || "Default",
          size: v.size || "Standard",
          price: typeof v.price === "number" ? v.price : parseFloat(v.price) || 0,
          stock: typeof v.stock === "number" ? v.stock : parseInt(v.stock, 10) || 0,
          image: v.image || null
        }))
      : [];

    const productData = {
      productId,
      name,
      brand,
      category,
      description,
      status: status || "active"
    };

    if (formattedVariants.length > 0) {
      productData.variants = {
        create: formattedVariants
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        variants: true
      }
    });

    res.status(201).json(product);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message || "Failed to create product"
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      name,
      brand,
      category,
      description,
      status
    } = req.body;

    const updatedProduct = await prisma.product.update({
      where: {
        productId
      },
      data: {
        name,
        brand,
        category,
        description,
        status
      },
      include: {
        variants: true
      }
    });

    res.json(updatedProduct);

  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(500).json({
      message: "Failed to update product"
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    await prisma.product.delete({
      where: {
        productId
      }
    });

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(500).json({
      message: "Failed to delete product"
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};