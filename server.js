const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
var path = require("path");
const session = require("express-session");
const axios = require("axios"); // 导入 axios 模块

// 初始化Express应用程序
const app = express();

// 使用 session 中间件
app.use(
  session({
    secret: "20001215",
    resave: false,
    saveUninitialized: false,
  })
);

// 设置body-parser中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname + "/public")));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "956282",
  database: "webproject",
});
//默认页面
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
//注册页面
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});
//首页页面
app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
//添加游戏页面
app.get("/add", (req, res) => {
  res.sendFile(__dirname + "/add.html");
});

//Cart页面
app.get("/cart", (req, res) => {
  res.sendFile(__dirname + "/cart.html");
});
//添加游戏页面
app.get("/manage", (req, res) => {
  res.sendFile(__dirname + "/manage.html");
});
//Top 10 sale game
//添加游戏页面
app.get("/top", (req, res) => {
  res.sendFile(__dirname + "/top10.html");
});


//cart
app.post('/cart', function(req, res) {
  var productId = req.body.productId; // 从请求体中获取产品ID
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中
  console.log(productId, user_id);
      // 查询购物车
      connection.query(
        "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
        [user_id, productId],
        (err, results) => {
          if (err) {
            console.error("Error querying database: " + err.stack);
            res.status(500).send("Internal Server Error");
            return;
          }

          if (results.length > 0) {
            // 如果购物车中已经存在相同的产品，则直接发送消息给客户端
            connection.query(
              "SELECT * FROM products WHERE user_id = ? AND product_id = ?",
              [user_id, productId],
              (err, productResults) => {
                if (err) {
                  console.error("Error querying products database: " + err.stack);
                  res.status(500).send("Internal Server Error");
                  return;
                }
                // 将查询结果发送给前端
                console.log(productResults);
                res.status(200).json({
                  message: "This game already exists in your cart!",
                  products: productResults
                });
              }
            );
          } else {
            // 如果购物车中不存在相同的产品，则执行插入操作
            connection.query(
              "INSERT INTO cart (user_id, product_id) VALUES (?, ?)",
              [user_id, productId],
              (err, insertResults) => {
                if (err) {
                  console.error("Error inserting into database: " + err.stack);
                  res.status(500).send("Internal Server Error");
                  return;
                }
                // 插入成功后，再次查询购物车中新增产品的信息并将其发送给客户端
                connection.query(
                  "SELECT * FROM products WHERE user_id = ? AND product_id = ?",
                  [user_id, productId],
                  (err, productResults) => {
                    if (err) {
                      console.error("Error querying products database: " + err.stack);
                      res.status(500).send("Internal Server Error");
                      return;
                    }
                    // 将查询结果发送给前端
                    console.log(productResults);
                    res.status(200).json({
                      message: "Game added to cart successfully!",
                      products: productResults
                    });
                  }
                );
              }
            );
          }
        }
      );
});

//GetAll cart
app.get('/allcarts', function(req, res) {
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中
  console.log("User ID:", user_id);

  // 查询购物车
  connection.query(
    "SELECT * FROM cart WHERE user_id = ?",
    [user_id],
    (err, cartResults) => {
      console.log(cartResults);
      if (err) {
        console.error("Error querying cart database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 没有购物车记录
      if (cartResults.length === 0) {
        console.log("No items in the cart for user:", user_id);
        res.status(200).json({
          message: "No items in the cart for this user",
          cart: []
        });
        return;
      }

      // 从购物车中提取 product_id 列表
      var productIds = cartResults.map(cartItem => cartItem.product_id);

      // 查询对应产品的详细信息
      connection.query(
        "SELECT * FROM products WHERE user_id = ? AND product_id IN (?)",
        [user_id, productIds],
        (err, productResults) => {
          if (err) {
            console.error("Error querying products database: " + err.stack);
            res.status(500).send("Internal Server Error");
            return;
          }

          // 构建一个 map 以便于通过 product_id 查找产品信息
          var productMap = {};
          productResults.forEach(product => {
            productMap[product.product_id] = product;
          });

          // 将购物车中的产品和对应的产品信息进行匹配
          var cartWithDetails = cartResults.map(cartItem => {
            return {
              cartItem: cartItem,
              productDetails: productMap[cartItem.product_id]
            };
          });

          console.log("Cart with details:", cartWithDetails);
          res.status(200).json({
            message: "Cart details retrieved successfully",
            cart: cartWithDetails
          });
        }
      );
    }
  );
});

//cart function delete
app.post('/deleteCartItem', (req, res) => {
  // 从请求体中获取用户 ID 和产品 ID
  const { productId } = req.body;
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中
  console.log(user_id, productId)
  connection.query(
    "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
    [user_id, productId],
    (err, results) => {
      if (err) {
        console.error("Error deleting from database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.send("<script>window.alert('Item deleted from cart!'); window.location='/';</script>");
    }
  );
});


//Login 
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // 在数据库中查询是否存在相同用户名的账户
  connection.query(
    "SELECT * FROM login WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 如果存在相同用户名的账户，则尝试登录
      if (results.length > 0) {
        // 在实际应用中，应该使用安全的方法来验证密码
        if (results[0].password === password) {
          // res.status(200).send("Login successful!");
          req.session.user_id = results[0].user_id;
          res.send( "<script>window.alert('Login Sucessful!'); window.location='/home';</script>");
        } else {
          res.send( "<script>window.alert('Invalid username or password!'); window.location='/';</script>");
        }
      } else {
      }
    }
  );
});
//account register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  // 检查用户名是否已经存在
  connection.query(
    "SELECT * FROM login WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }
      // 如果用户名已经存在，则返回错误消息
      if (results.length > 0) {
        let userExists = false;
        for (let i = 0; i < results.length; i++) {
          if (results[i].username === username) {
            userExists = true;
            if (results[i].password === password) {
              res.send( "<script>window.alert('Account already exist! Please go to sign in!'); window.location='/';</script>"); // 发送用户名已存在的错误消息
            } else {
              res.send( "<script>window.alert('Username already exists! But Wrong Password!'); window.location='/';</script>");
            }
            break;
          }
        }
        if (!userExists) {
          // 如果用户名不存在，则创建新用户并返回成功消息
          connection.query(
            "INSERT INTO login (username, password) VALUES (?, ?)",
            [username, password],
            (err, results) => {
              if (err) {
                console.error("Error inserting into database: " + err.stack);
                res.status(500).send("Internal Server Error");
                return;
              }
              res.send( "<script>window.alert('Register Sucessful!'); window.location='/';</script>");
            }
          );
        }
      } else {
        // 如果用户名不存在，则创建新用户并返回成功消息
        connection.query(
          "INSERT INTO login (username, password) VALUES (?, ?)",
          [username, password],
          (err, results) => {
            if (err) {
              console.error("Error inserting into database: " + err.stack);
              res.status(500).send("Internal Server Error");
              return;
            }
            res.send( "<script>window.alert('Register Sucessful!'); window.location='/';</script>");
          }
        );
      }
    }
  );
});

//add game
app.post("/addgoods", (req, res) => {
  const {
    product_name,
    category_id,
    product_description,
    product_price,
    product_images,
    product_price_promotion,
  } = req.body;

  // 假设用户已经登录，并且登录信息中包含了 user_id
  const user_id = req.session.user_id; // 这里假设通过 req.user 获取到了用户的登录信息
  // 查询登录表获取用户的user_id

  // 执行数据库插入操作
  connection.query(
    "INSERT INTO products (user_id, category_id, product_name, product_description, product_images,product_price, product_price_promotion) VALUES (?, ?, ?, ?, ?, ?,?)",
    [
      user_id,
      category_id,
      product_name,
      product_description,
      product_images,
      product_price,
      product_price_promotion,
    ],
    (err, results) => {
      console.log(results);
      if (err) {
        console.error("Error inserting into database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }
      console.log("Insertion results:", results); // 输出插入结果
      // 根据插入结果发送不同的消息
      if (results.affectedRows > 0) {
        // 如果受影响的行数大于0，则插入成功
        res.send(
          "<script>window.alert('添加成功'); window.location='/add';</script>"
        ); // 发送JavaScript弹窗显示"添加成功"并执行前端重定向
      } else {
        // 否则，插入失败
        res.send("<script>window.alert('添加失败');</script>"); // 发送JavaScript弹窗显示"添加失败"
      }

      // res.send("Product inserted successfully!"); // 发送插入成功的消息
    }
  );
});

 //navagate category dynamic
app.get("/user/category", (req, res) => {
  // 获取用户ID，假设它存储在 session 中的 user_id 中
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中

  if (!user_id) {
    // 如果用户未登录，则发送一个错误响应
    res.status(401).send("Please login to view products.");
    return;
  }

  // 在数据库中查询用户的产品类别和类别名称
  connection.query(
    "SELECT category_id FROM products WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.length === 0) {
        // 如果未找到与用户关联的产品类别，则发送一个错误响应
        res.status(404).send("Category ID not found for this user.");
        return;
      }

      const categories = results.map((result) => result.category_id); // 提取类别 ID 数组

      // 发送与用户关联的产品类别给客户端
      res.json({ categories: categories }); // 返回包含类别数组的 JSON 对象
    }
  );
});


// home page send game
app.get("/products", (req, res) => {
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中
  
  // 执行查询以检索特定用户的产品信息
  connection.query(
      "SELECT p.user_id, p.product_id, p.category_id, p.product_name, p.product_description, p.product_images, p.product_price, p.product_price_promotion, s.product_sales_count FROM products p LEFT JOIN sales s ON p.product_id = s.product_id WHERE p.user_id = ? ORDER BY RAND() LIMIT 4",
      [user_id],
      (err, results) => {
          if (err) {
              console.error("Error querying database: " + err.stack);
              res.status(500).send("Internal Server Error");
              return;
          }

          // 将图片数据转换为Base64编码的字符串
          results.forEach(function(product) {
              if (Buffer.isBuffer(product.product_images)) {
                  // 将 Buffer 对象转换为 Base64 编码的字符串
                  product.product_images = product.product_images.toString('base64');
              }
          });

          // console.log(results);
          res.json(results);
      }
  );
});

//management
app.get("/management", (req, res) => {
  var user_id = req.session.user_id; 

  // 执行查询以检索特定用户的产品信息
  connection.query(
    "SELECT user_id, product_id, category_id, product_name, product_description, product_images, product_price, product_price_promotion FROM products WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 将查询结果中的 BLOB 图像数据转换为 Base64 格式
      results.forEach(function (product) {
        if (product.product_images_base64) {
          product.product_images_base64 =
            product.product_images_base64.toString("base64");
        }
      });
        console.log(results);
      // 将查询结果发送给前端
      console.log(results);
      res.json(results);
    }
  );
});

//home page buy
app.post('/purchase', (req, res) => {
  const productId = req.body.productId; 
  const productPrice = req.body.productPricepromotion; 
  var user_id = req.session.user_id; 
  // 尝试插入新记录，如果记录已存在则更新现有记录
  connection.query(
    'INSERT INTO bill(user_id, product_id, number_of_item, bill_price) VALUES (?, ?, 1, ?) ',
    [user_id, productId, productPrice],
    (err, results) => {
      console.log(results);
      if (err) {
        console.error('Error inserting or updating sales record:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log('Sales record inserted or updated successfully');
      
      // 构造包含购买信息的弹窗内容
      const purchaseInfo = `You already purchased!，Product ID：${productId}，Price：${productPrice}`;
      console.log('Purchase info:', purchaseInfo); // 添加调试信息
      
      const responseHtml = `
        <script>
          alert('${purchaseInfo}');
        </script>
      `;
      console.log('Response HTML:', responseHtml); // 添加调试信息
      res.json({ message: purchaseInfo });
    }
  );
});

//car ways buy games
app.post('/cartbuy', (req, res) => {
  const productId = req.body.productId;
  const billprice = req.body.billprice;
  const quantity = req.body.quantity;
  var user_id = req.session.user_id;
  // 尝试插入新记录，如果记录已存在则更新现有记录
  connection.query(
    'INSERT INTO bill(user_id, product_id, number_of_item, bill_price) VALUES (?, ?, ?, ?) ',
    [user_id, productId, quantity, billprice],
    (err, results) => {
      if (err) {
        console.error('Error inserting or updating sales record:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log('Sales record inserted or updated successfully');
      
      // 构造购买成功的消息
      const purchaseInfo = {
        message: '购买成功！',
        productId: productId,
        quantity: quantity,
        billprice: billprice
      };
      res.json(purchaseInfo); // 返回购买成功的消息给客户端
    }
  );
});

// Selase Top 10 games
app.get('/topsales', (req, res) => {
  const user_id = req.session.user_id;
  console.log(user_id);

  // 查询销量前十的游戏，并将具有相同 product_id 的 number_of_item 相加
  connection.query(
      'SELECT product_id, SUM(number_of_item) AS total_items FROM bill WHERE user_id = ? GROUP BY product_id ORDER BY total_items DESC LIMIT 10',
      [user_id],
      (err, results) => {
          if (err) {
              console.error('Error querying top sales:', err);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
          }

          // 使用 Promise.all 来等待所有更新查询完成
          Promise.all(results.map((row) => {
              const productId = row.product_id;
              const totalItems = row.total_items;

              // 返回一个 Promise
              return new Promise((resolve, reject) => {
                  // 更新 sales 表中的 product_sales_item，如果记录不存在则插入新记录
                  connection.query(
                      'INSERT INTO sales (user_id, product_id, product_sales_count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE product_sales_count = ?',
                      
                      [user_id, productId, totalItems, totalItems],
                      (err, results) => {
                          if (err) {
                              reject(err);
                              return;
                          }
                          resolve();
                      }
                  );
              });
          })).then(() => {
              // console.log('All sales records inserted or updated successfully');
              res.json({ success: true }); // 返回成功响应给客户端
          }).catch((err) => {
              console.error('Error inserting or updating sales records:', err);
              res.status(500).json({ error: 'Internal Server Error' });
          });
      }
  );
});


//consequence rank
app.get('/consequence', (req, res) => {
  const user_id = req.session.user_id;

  // 查询指定 user_id 的 sales 表数据，并按照 product_sales_count 进行降序排列
  connection.query(
    'SELECT product_id, product_sales_count FROM sales WHERE user_id = ? ORDER BY product_sales_count DESC',
    [user_id],
    (err, results) => {
      console.log(results);
      if (err) {
        console.error('Error querying sales records:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      // 获取查询结果中的 product_id 序列
      const productIds = results.map(record => record.product_id);

      // 查询 products 表中对应 product_id 的产品名称，并按照 product_id 降序排列
      connection.query(
        'SELECT product_id, product_name FROM products WHERE product_id IN (?) ORDER BY FIELD(product_id, ?)',
        [productIds, productIds],
        (err, productResults) => {
          if (err) {
            console.error('Error querying product names:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          // 将产品名称与销售数量合并
          const salesWithNames = productResults.map(product => {
            const salesRecord = results.find(record => record.product_id === product.product_id);
            return {
              product_id: product.product_id,
              product_name: product.product_name,
              product_sales_count: salesRecord ? salesRecord.product_sales_count : 0
            };
          });
          console.log(productResults);
          res.json({ success: true, sales: salesWithNames });
        }
      );
    }
  );
});

// 连接到MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);
});

// 监听端口
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
