// --- SERIALIZACIÓN MANUAL ---
function serializeUsers(users) {
    return users.map(u => [
        u.id, u.username, u.password, u.role, u.comprasAnualesValor || 0, u.nivelFidelidad || "Bronce"
    ].join('|')).join(';');
}
function deserializeUsers(str) {
    if (!str) return [{ username: 'admin', password: 'cafe', role: 'admin', id: 0, comprasAnualesValor: 0, nivelFidelidad: "Bronce" }];
    return str.split(';').map(s => {
        const [id, username, password, role, comprasAnualesValor, nivelFidelidad] = s.split('|');
        return {
            id: Number(id),
            username,
            password,
            role,
            comprasAnualesValor: Number(comprasAnualesValor) || 0,
            nivelFidelidad: nivelFidelidad || "Bronce"
        };
    });
}

function serializeProducts(products) {
    return products.map(p => [
        p.id, p.nombre, p.precioBase, p.descripcion, p.tipo, p.imagen,
        (p.notasSabor || []).join(','), p.intensidad, p.stock
    ].join('|')).join(';');
}
function deserializeProducts(str) {
    if (!str) return [
        { id: 1, nombre: "Café Molido Gourmet", precioBase: 6, descripcion: "Nuestro Café Molido Gourmet ofrece una experiencia clásica y equilibrada. Con notas suaves de chocolate y un toque a nuez, su acidez moderada lo hace perfecto para el día a día. Ideal para aquellos que buscan un café aromático y fácil de disfrutar.", tipo: "gourmet", imagen: "IMAGENES/gourmet.png", notasSabor: ["chocolate", "nueces"], intensidad: "media", stock: 30000 },
        { id: 2, nombre: "Café de Origen (Colombiano)", precioBase: 7, descripcion: "Directamente de las altas montañas de Colombia, este café de origen único destaca por su perfil vibrante. Disfruta de sus notas cítricas y florales que aportan una frescura inigualable. Un café con cuerpo medio y un final limpio, ideal para explorar sabores auténticos.", tipo: "origen", imagen: "IMAGENES/origen.png", notasSabor: ["cítrico", "floral"], intensidad: "media", stock: 50000 },
        { id: 3, nombre: "Geisha Especialidad", precioBase:20, descripcion: "Considerado la joya de la corona, nuestro Geisha de especialidad es una experiencia sensorial única. Con un perfil exquisitamente floral, toques cítricos y afrutados, y un cuerpo sedoso, este café es para los paladares más exigentes. Su exclusividad y complejidad lo hacen inigualable.", tipo: "especialidad", imagen: "IMAGENES/Geisha.png", notasSabor: ["jazmín", "durazno"], intensidad: "suave", stock: 10000 },
        { id: 4, nombre: "Bourbon Especialidad", precioBase: 20, descripcion: "El café Bourbon de especialidad te envuelve con su dulzor natural y un cuerpo perfectamente equilibrado. Sus pronunciadas notas a chocolate se fusionan con matices de frutas maduras y caramelo, creando una bebida rica y reconfortante. Una opción sublime para los amantes de los sabores profundos y armoniosos.", tipo: "especialidad", imagen: "IMAGENES/Bourbon.png", notasSabor: ["chocolate", "caramelo", "frutas maduras"], intensidad: "fuerte", stock: 25000 }
    ];
    return str.split(';').map(s => {
        const [id, nombre, precioBase, descripcion, tipo, imagen, notasSabor, intensidad, stock] = s.split('|');
        return {
            id: Number(id),
            nombre,
            precioBase: Number(precioBase),
            descripcion,
            tipo,
            imagen,
            notasSabor: notasSabor ? notasSabor.split(',') : [],
            intensidad,
            stock: Number(stock)
        };
    });
}

function serializeVentas(ventas) {
    return ventas.map(v => [
        v.fecha,
        v.usuario,
        v.items.map(i => [i.id, i.cantidad].join(',')).join('~')
    ].join('|')).join(';');
}
function deserializeVentas(str) {
    if (!str) return [];
    return str.split(';').map(s => {
        const [fecha, usuario, itemsStr] = s.split('|');
        return {
            fecha,
            usuario,
            items: itemsStr ? itemsStr.split('~').map(i => {
                const [id, cantidad] = i.split(',');
                return { id: Number(id), cantidad: Number(cantidad) };
            }) : []
        };
    });
}

// --- INICIALIZACIÓN ---
let users = deserializeUsers(localStorage.getItem('users'));

// Asegura que el admin exista
if (!users.some(u => u.username === 'admin')) {
    users.push({ username: 'admin', password: 'cafe', role: 'admin', id: 0, comprasAnualesValor: 0, nivelFidelidad: "Bronce" });
    saveUsers();
}

let products = deserializeProducts(localStorage.getItem('products'));
let ventas = deserializeVentas(localStorage.getItem('ventas')) || [];
let currentUser = null;

// --- GUARDADO ---
function saveUsers() {
    localStorage.setItem('users', serializeUsers(users));
}
function saveProducts() {
    localStorage.setItem('products', serializeProducts(products));
}
function saveVentas() {
    localStorage.setItem('ventas', serializeVentas(ventas));
}
function saveCurrentUser() {
    localStorage.setItem('currentUserId', currentUser ? currentUser.id : '');
    updateAuthUI();
}
function loadCurrentUser() {
    const id = localStorage.getItem('currentUserId');
    currentUser = users.find(u => u.id == id) || null;
}
loadCurrentUser();

let carrito = [];
let productoSeleccionado = null;
let currentProductDetail = null;

function generateProductId() {
    return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

function openRegisterModal() {
    const authModal = document.getElementById('authModal');
    document.getElementById('authModalTitle').textContent = 'Registrarse';
    document.getElementById('authSubmitButton').textContent = 'Registrarse';
    document.getElementById('authSubmitButton').onclick = registerUser;
    document.getElementById('adminCheckboxGroup').style.display = 'block'; 
    document.getElementById('authMessage').textContent = ''; 
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('registerAsAdmin').checked = false;
    authModal.style.display = 'flex';
}

function openLoginModal() {
    const authModal = document.getElementById('authModal');
    document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';
    document.getElementById('authSubmitButton').textContent = 'Iniciar Sesión';
    document.getElementById('authSubmitButton').onclick = loginUser;
    document.getElementById('adminCheckboxGroup').style.display = 'none'; 
    document.getElementById('authMessage').textContent = '';
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    authModal.style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function registerUser() {
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const registerAsAdmin = document.getElementById('registerAsAdmin').checked;
    const authMessage = document.getElementById('authMessage');

    if (!username || !password) {
        authMessage.textContent = 'Por favor, ingresa usuario y contraseña.';
        return;
    }

    if (username.includes(' ') || password.includes(' ')) {
        authMessage.textContent = 'Usuario y contraseña no deben contener espacios.';
        return;
    }

    if (users.some(user => user.username === username)) {
        authMessage.textContent = 'El nombre de usuario ya existe.';
        return;
    }

    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: username,
        password: password,
        role: registerAsAdmin ? 'admin' : 'user',
        comprasAnualesValor: 0, 
        nivelFidelidad: "Bronce" 
    };
    users.push(newUser);
    saveUsers();
    showNotification('Registro exitoso. ¡Bienvenido!', 'success');
    closeAuthModal();
}

function loginUser() {
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const authMessage = document.getElementById('authMessage');

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        saveCurrentUser();
        showNotification(`Bienvenido, ${currentUser.username}!`, 'success');
        closeAuthModal();
        updateAuthUI();
    } else {
        authMessage.textContent = 'Usuario o contraseña incorrectos.';
    }
}

function logout() {
    currentUser = null;
    saveCurrentUser();
    showNotification('Sesión cerrada.', 'info');
    updateAuthUI();
}

function openAdminModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Acceso denegado. No eres administrador.', 'error');
        return;
    }
    document.getElementById('adminModal').style.display = 'flex';
    renderAdminPanelData();
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function renderAdminPanelData() {
    document.getElementById('totalUsersStat').textContent = users.length;
    document.getElementById('totalProductsStat').textContent = products.length;
    let estimatedSales = carrito.reduce((sum, item) => sum + item.precioFinal, 0); 
    document.getElementById('estimatedSalesStat').textContent = `$${estimatedSales.toFixed(2)}`;

    const userListAdmin = document.getElementById('userListAdmin');
    userListAdmin.innerHTML = '';
    users.forEach(user => {
        const row = userListAdmin.insertRow();
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>
                ${user.role !== 'admin' ? `<button onclick="deleteUser(${user.id})" class="delete-btn">Eliminar</button>` : ''}

            </td>
        `;
    });

    const productListAdmin = document.getElementById('productListAdmin');
    productListAdmin.innerHTML = '';
    products.forEach(product => {
        const row = productListAdmin.insertRow();
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.nombre}</td>
            <td>$${product.precioBase.toFixed(2)}</td>
            <td>${product.stock}</td> <!-- Agrega esta línea -->
            <td>
                <button onclick="editProduct(${product.id})">Editar</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Eliminar</button>
            </td>
        `;
    });

    const dssDiv = document.getElementById('adminDSS');
    if (dssDiv) {
        let sugerencias = [];
        let ventasPorProducto = {};
        ventas.forEach(venta => {
            venta.items.forEach(item => {
                ventasPorProducto[item.id] = (ventasPorProducto[item.id] || 0) + item.cantidad;
            });
        });

        let populares = products.filter(p => ventasPorProducto[p.id] >= 5);
        populares.forEach(p => sugerencias.push(`Recomendación: Considera aumentar el stock de <b>${p.nombre}</b> (muy popular, stock actual: ${p.stock}).`));

        let sinVentas = products.filter(p => !ventasPorProducto[p.id]);
        sinVentas.forEach(p => sugerencias.push(`Sugerencia: <b>${p.nombre}</b> no tiene ventas recientes. Considera una promoción o descuento.`));

        let bajaVenta = products.filter(p => ventasPorProducto[p.id] > 0 && ventasPorProducto[p.id] <= 2);
        bajaVenta.forEach(p => sugerencias.push(`Sugerencia: <b>${p.nombre}</b> tiene pocas ventas. Prueba destacarlo en la tienda.`));

        let bajoStock = products.filter(p => p.stock <= 3);
        bajoStock.forEach(p => sugerencias.push(`Alerta: <b>${p.nombre}</b> tiene stock bajo (${p.stock} unidades).`));

        dssDiv.innerHTML = `<h3>Sistema de Sugerencias Inteligentes</h3>
            <ul>${sugerencias.length ? sugerencias.map(s => `<li>${s}</li>`).join('') : '<li>No hay sugerencias por ahora.</li>'}</ul>`;
    }
}

function deleteUser(userId) {
    if (confirm('¿Estás seguro de que quieres eliminar a este usuario?')) {
        users = users.filter(user => user.id !== userId);
        saveUsers();
        showNotification('Usuario eliminado exitosamente.', 'success');
        renderAdminPanelData();
    }
}

let editingProductId = null;

function openAddProductModal() {
    document.getElementById('addProductModal').style.display = 'flex';
    document.getElementById('addProductModalTitle').textContent = 'Agregar';
    document.getElementById('saveProductButton').textContent = 'Guardar Producto';
    document.getElementById('saveProductButton').onclick = saveProduct;
    document.getElementById('productName').value = '';
    document.getElementById('productPriceBase').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productType').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productFlavorNotes').value = '';
    document.getElementById('productIntensity').value = 'media';
    document.getElementById('productStock').value = 10;
    document.getElementById('addProductMessage').textContent = '';
    editingProductId = null;
}

function editProduct(productId) {
    const productToEdit = products.find(p => p.id === productId);
    if (!productToEdit) {
        showNotification('Producto no encontrado.', 'error');
        return;
    }
    document.getElementById('addProductModal').style.display = 'flex';
    document.getElementById('addProductModalTitle').textContent = 'Editar';
    document.getElementById('saveProductButton').textContent = 'Actualizar Producto';
    document.getElementById('saveProductButton').onclick = saveProduct; 
    
    document.getElementById('productName').value = productToEdit.nombre;
    document.getElementById('productPriceBase').value = productToEdit.precioBase;
    document.getElementById('productDescription').value = productToEdit.descripcion;
    document.getElementById('productType').value = productToEdit.tipo;
    document.getElementById('productImage').value = productToEdit.imagen;
    document.getElementById('productFlavorNotes').value = productToEdit.notasSabor.join(', ');
    document.getElementById('productIntensity').value = productToEdit.intensidad;
    document.getElementById('productStock').value = productToEdit.stock || 0;
    document.getElementById('addProductMessage').textContent = '';
    editingProductId = productId;
}

function saveProduct() {
    const productName = document.getElementById('productName').value;
    const productPriceBase = parseFloat(document.getElementById('productPriceBase').value);
    const productDescription = document.getElementById('productDescription').value;
    const productType = document.getElementById('productType').value;
    const productImage = document.getElementById('productImage').value;
    const productFlavorNotes = document.getElementById('productFlavorNotes').value.split(',').map(s => s.trim()).filter(s => s);
    const productIntensity = document.getElementById('productIntensity').value;
    const productStock = parseInt(document.getElementById('productStock').value);
    const addProductMessage = document.getElementById('addProductMessage');

    if (!productName || isNaN(productPriceBase) || productPriceBase <= 0 || !productDescription || !productType || !productImage) {
        addProductMessage.textContent = 'Por favor, completa todos los campos obligatorios.';
        return;
    }

    if (editingProductId) {
       
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                nombre: productName,
                precioBase: productPriceBase,
                descripcion: productDescription,
                tipo: productType,
                imagen: productImage,
                notasSabor: productFlavorNotes,
                intensidad: productIntensity,
                stock: productStock
            };
            showNotification('Producto actualizado exitosamente.', 'success');
        }
    } else {
        
        const newProduct = {
            id: generateProductId(),
            nombre: productName,
            precioBase: productPriceBase,
            descripcion: productDescription,
            tipo: productType,
            imagen: productImage,
            notasSabor: productFlavorNotes,
            intensidad: productIntensity,
            stock: productStock
        };
        products.push(newProduct);
        showNotification('Producto agregado exitosamente.', 'success');
    }
    saveProducts();
    renderizarProductos(); 
    renderAdminPanelData(); 
    closeAddProductModal();
}

function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        products = products.filter(product => product.id !== productId);
        saveProducts();
        showNotification('Producto eliminado exitosamente.', 'success');
        renderizarProductos(); 
        renderAdminPanelData(); 
    }
}

function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
}


function showNotification(message, type = 'success') {
    const notification = document.getElementById("custom-notification");
    notification.textContent = message;
    let bgColor;
    switch(type) {
        case 'success':
            bgColor = '#4CAF50';
            break;
        case 'error':
            bgColor = '#f44336';
            break;
        case 'info':
            bgColor = '#2196F3';
            break;
        default:
            bgColor = '#4CAF50';
    }
    notification.style.backgroundColor = bgColor;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function renderizarProductos() {
    const contenedorProductos = document.getElementById("productos");
    contenedorProductos.innerHTML = '';
    products.forEach(producto => {
        const productoDiv = document.createElement("div");
        productoDiv.classList.add("producto");
        productoDiv.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <strong>Precio: $${producto.precioBase.toFixed(2)}</strong>
            <button onclick="abrirModalCompra(${producto.id})">Seleccionar opciones</button>
        `;
        productoDiv.onclick = (event) => {
            if (event.target.tagName !== 'BUTTON') {
                openProductDetailModal(producto.id);
            }
        };
        contenedorProductos.appendChild(productoDiv);
    });
}

function calcularPrecioConDescuento(producto, presentacion, cantidad, tueste) {
    let precioUnitarioPorG = producto.precioBase / 250;
    let precioPorPresentacionMultiplicador;

    switch (presentacion) {
        case "250": precioPorPresentacionMultiplicador = 1; break;
        case "500": precioPorPresentacionMultiplicador = 1.8; break;
        case "1000": precioPorPresentacionMultiplicador = 3.5; break;
        case "3000": precioPorPresentacionMultiplicador = 10; break;
        default: precioPorPresentacionMultiplicador = 1;
    }

    let precioBaseCalculado = producto.precioBase * precioPorPresentacionMultiplicador;
    let precioAntesDescuentosLocales = precioBaseCalculado * cantidad;
    let descuentoLocal = 0;
    let mensajeDescuento = [];

    if (cantidad >= 5) {
        let desc = precioAntesDescuentosLocales * 0.10;
        descuentoLocal += desc;
        mensajeDescuento.push(`10% por Cantidad ($${desc.toFixed(2)})`);
    }
    if (tueste === "oscuro") {
        let desc = precioAntesDescuentosLocales * 0.03;
        descuentoLocal += desc;
        mensajeDescuento.push(`3% por Tueste Oscuro ($${desc.toFixed(2)})`);
    }

    let precioFinalLocal = precioAntesDescuentosLocales - descuentoLocal;

    return {
        precioFinal: precioFinalLocal,
        descuento: descuentoLocal,
        precioAntesDescuentosLocales: precioAntesDescuentosLocales,
        mensajeDescuento: mensajeDescuento.length > 0 ? `Se aplicó: ${mensajeDescuento.join(', ')}` : "No se aplicaron descuentos."
    };
}

function abrirModalCompra(idProducto) {
    productoSeleccionado = products.find(p => p.id === idProducto);
    if (!productoSeleccionado) return;

    document.getElementById("modal-product-image").src = productoSeleccionado.imagen;
    document.getElementById("titulo-modal").textContent = productoSeleccionado.nombre;
    document.getElementById("descripcion-modal").textContent = productoSeleccionado.descripcion;
    document.getElementById("presentacion").value = "250";
    document.getElementById("cantidad").value = "1";
    document.getElementById("tueste").value = "medio";

    updatePurchaseConfigModalDiscount();

    document.getElementById("presentacion").onchange = updatePurchaseConfigModalDiscount;
    document.getElementById("cantidad").oninput = updatePurchaseConfigModalDiscount;
    document.getElementById("tueste").onchange = updatePurchaseConfigModalDiscount;

    document.getElementById("purchaseConfigModal").style.display = "flex";
}

function updatePurchaseConfigModalDiscount() {
    const presentacion = document.getElementById("presentacion").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const tueste = document.getElementById("tueste").value;

    if (!productoSeleccionado) return;

    const { precioFinal, descuento, precioAntesDescuentosLocales, mensajeDescuento } = calcularPrecioConDescuento(productoSeleccionado, presentacion, cantidad, tueste);

    const descuentoAplicadoElem = document.getElementById("descuento-aplicado");
    if (descuento > 0) {
        descuentoAplicadoElem.innerHTML = `Precio Original: $<span>${precioAntesDescuentosLocales.toFixed(2)}</span>. Precio con descuentos: $${precioFinal.toFixed(2)}<br>${mensajeDescuento}`;
    } else {
        descuentoAplicadoElem.textContent = "No se aplicaron descuentos adicionales para esta configuración.";
    }

    const recomendacionDiv = document.getElementById("recomendacion");
    recomendacionDiv.innerHTML = ''; 

    if (currentUser && currentUser.comprasAnualesValor >= 1000) {
        recomendacionDiv.innerHTML = `<p>¡Felicidades, **${currentUser.username}**! Como cliente **${currentUser.nivelFidelidad}** y con compras que superan los $1000, considera nuestro ${productoSeleccionado.tipo === 'especialidad' ? 'Geisha Especialidad' : 'Café de Origen (Colombiano)'} para una experiencia superior. ¡Disfruta de tu estatus exclusivo!</p>`;
    } else if (currentUser && currentUser.comprasAnualesValor >= 500 && currentUser.comprasAnualesValor < 1000) {
        recomendacionDiv.innerHTML = `<p>¡Hola, **${currentUser.username}**! Como cliente **${currentUser.nivelFidelidad}**, te sugerimos probar nuestro ${productoSeleccionado.tipo === 'gourmet' ? 'Café de Origen (Colombiano)' : 'Café Molido Gourmet'} para expandir tu paladar. ¡Sigue acumulando puntos para más beneficios!</p>`;
    } else if (currentUser) {
        recomendacionDiv.innerHTML = `<p>¡Bienvenido, **${currentUser.username}**! Si te gusta el ${productoSeleccionado.nombre}, también podrías disfrutar de nuestro ${productoSeleccionado.tipo === 'gourmet' ? 'Café de Origen (Colombiano)' : 'Café Molido Gourmet'}. ¡Cada taza te acerca a un mundo de sabor!</p>`;
    }
}


function cerrarModal() {
    document.getElementById("purchaseConfigModal").style.display = "none";
}

function agregarAlCarrito() {
    const presentacion = document.getElementById("presentacion").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const tueste = document.getElementById("tueste").value;

    if (cantidad <= 0) {
        showNotification("La cantidad debe ser al menos 1.", "error");
        return;
    }

    const stockDisponible = productoSeleccionado.stock || 0;
    const enCarrito = carrito
        .filter(item => item.id === productoSeleccionado.id)
        .reduce((sum, item) => sum + item.cantidad, 0);

    if (cantidad + enCarrito > stockDisponible) {
        showNotification(`No hay suficiente stock disponible. Stock actual: ${stockDisponible - enCarrito}`, "error");
        return;
    }

    const { precioFinal, descuento, precioAntesDescuentosLocales } = calcularPrecioConDescuento(productoSeleccionado, presentacion, cantidad, tueste);

    const itemExistente = carrito.find(item =>
        item.id === productoSeleccionado.id &&
        item.presentacion === presentacion &&
        item.tueste === tueste
    );

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
        itemExistente.precioAntesDescuentosLocales += precioAntesDescuentosLocales;
        itemExistente.descuento += descuento;
        itemExistente.precioFinal += precioFinal;
    } else {
        carrito.push({
            id: productoSeleccionado.id,
            nombre: productoSeleccionado.nombre,
            presentacion: presentacion,
            cantidad: cantidad,
            tueste: tueste,
            precioUnitarioBase: productoSeleccionado.precioBase,
            precioAntesDescuentosLocales: precioAntesDescuentosLocales,
            descuento: descuento,
            precioFinal: precioFinal
        });
    }
    showNotification(`${cantidad} unidad(es) de ${productoSeleccionado.nombre} (${presentacion}, ${tueste}) agregada(s) al carrito.`, 'success');
    cerrarModal();
}

function abrirCarritoModal() {
    const carritoItemsDiv = document.getElementById("items");
    carritoItemsDiv.innerHTML = "";
    let subtotal = 0;
    let ahorroTotal = 0;
    let descuentosAdicionalesTexto = ''; 

    carrito.forEach((item, index) => {
        const row = carritoItemsDiv.insertRow();
        row.innerHTML = `
            <td>${item.nombre}</td>
            <td>
                <div class="cantidad-controls">
                    <button onclick="cambiarCantidadCarrito(${index}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="cambiarCantidadCarrito(${index}, 1)">+</button>
                </div>
            </td>
            <td>${item.presentacion}g</td>
            <td>${item.tueste}</td>
            <td>$${item.precioAntesDescuentosLocales.toFixed(2)}</td>
            <td class="descuento-celda">-$${item.descuento.toFixed(2)}</td>
            <td>$${item.precioFinal.toFixed(2)}</td>
            <td><button class="eliminar-btn" onclick="eliminarDelCarrito(${index})"><i class="fas fa-trash-alt"></i></button></td>
        `;
        subtotal += item.precioFinal;
        ahorroTotal += item.descuento;
    });

    let totalGeneral = subtotal;
    if (subtotal >= 100) {
        let desc = subtotal * 0.15;
        totalGeneral -= desc;
        ahorroTotal += desc;
        descuentosAdicionalesTexto += `¡Felicidades! 15% de descuento adicional por compras mayores a $100. (Ahorro: $${desc.toFixed(2)})<br>`;
    } else if (subtotal >= 50) {
        let desc = subtotal * 0.05;
        totalGeneral -= desc;
        ahorroTotal += desc;
        descuentosAdicionalesTexto += `¡Buen trabajo! 5% de descuento adicional por compras mayores a $50. (Ahorro: $${desc.toFixed(2)})<br>`;
    }

    if (currentUser && currentUser.comprasAnualesValor >= 1500) {
        let desc = subtotal * 0.02; 
        totalGeneral -= desc;
        ahorroTotal += desc;
        descuentosAdicionalesTexto += `¡VIP! 2% de descuento extra por tu fidelidad como cliente ${currentUser.nivelFidelidad}. (Ahorro: $${desc.toFixed(2)})<br>`;
    }

    document.getElementById("subtotal-carrito").textContent = subtotal.toFixed(2);
    document.getElementById("total").textContent = totalGeneral.toFixed(2);
    document.getElementById("ahorro-total").textContent = ahorroTotal.toFixed(2);
    document.getElementById("descuentos-adicionales-carrito").innerHTML = descuentosAdicionalesTexto;

    document.getElementById("carritoModal").style.display = "flex";
}

function cerrarCarritoModal() {
    document.getElementById("carritoModal").style.display = "none";
}

function cambiarCantidadCarrito(index, delta) {
    if (carrito[index]) {
        const oldCantidad = carrito[index].cantidad;
        carrito[index].cantidad += delta;
        if (carrito[index].cantidad <= 0) {
            eliminarDelCarrito(index);
        } else {
            const originalProduct = products.find(p => p.id === carrito[index].id);
            const { precioFinal, descuento, precioAntesDescuentosLocales } = calcularPrecioConDescuento(originalProduct, carrito[index].presentacion, carrito[index].cantidad, carrito[index].tueste);
            carrito[index].precioFinal = precioFinal;
            carrito[index].descuento = descuento;
            carrito[index].precioAntesDescuentosLocales = precioAntesDescuentosLocales;
            abrirCarritoModal(); 
        }
    }
}

function eliminarDelCarrito(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        const removedItem = carrito.splice(index, 1)[0];
        showNotification(`${removedItem.nombre} eliminado del carrito.`, 'info');
        abrirCarritoModal(); 
    }
}

function finalizarCompra() {
    if (carrito.length === 0) {
        showNotification("Tu carrito está vacío. Agrega productos antes de finalizar la compra.", "error");
        return;
    }

    if (!currentUser) {
        showNotification("Por favor, inicia sesión para finalizar la compra.", "info");
        openLoginModal();
        return;
    }

    let totalCompra = carrito.reduce((sum, item) => sum + item.precioFinal, 0);

    if (currentUser) {
        currentUser.comprasAnualesValor = (currentUser.comprasAnualesValor || 0) + totalCompra;
        if (currentUser.comprasAnualesValor >= 1500) {
            currentUser.nivelFidelidad = "Oro";
        } else if (currentUser.comprasAnualesValor >= 500) {
            currentUser.nivelFidelidad = "Plata";
        } else {
            currentUser.nivelFidelidad = "Bronce";
        }
        saveUsers(); 
        saveCurrentUser(); 
        updateAuthUI();
    }

    ventas.push({
        fecha: new Date().toISOString(),
        usuario: currentUser ? currentUser.username : 'Invitado',
        items: carrito.map(item => ({ id: item.id, cantidad: item.cantidad }))
    });
    saveVentas();

    carrito.forEach(item => {
        const producto = products.find(p => p.id === item.id);
        if (producto) {
            producto.stock = Math.max(0, (producto.stock || 0) - item.cantidad);
        }
    });
    saveProducts(); 

    carrito.length = 0;
    showNotification("Compra finalizada exitosamente. ¡Gracias por tu preferencia!");
    cerrarCarritoModal();
}

function openProductDetailModal(idProducto) {
    currentProductDetail = products.find(p => p.id === idProducto);
    if (!currentProductDetail) return;

    document.getElementById('detail-product-image').src = currentProductDetail.imagen;
    document.getElementById('detail-product-name').textContent = currentProductDetail.nombre;
    document.getElementById('detail-product-description').textContent = currentProductDetail.descripcion;
    document.getElementById('detail-product-price').textContent = currentProductDetail.precioBase.toFixed(2);
    document.getElementById('detail-product-type').textContent = currentProductDetail.tipo.charAt(0).toUpperCase() + currentProductDetail.tipo.slice(1);
    document.getElementById('detail-product-flavor-notes').textContent = currentProductDetail.notasSabor.join(', ');

    const buyBtn = document.getElementById('buyFromDetailButton');
    buyBtn.onclick = function() {
        closeProductDetailModal(); 
        abrirModalCompra(currentProductDetail.id); 
    };

    document.getElementById("productDetailModal").style.display = "flex";
}

function closeProductDetailModal() {
    document.getElementById("productDetailModal").style.display = "none";
}

function openCoffeeTestModal() {
    document.getElementById("coffeeTestModal").style.display = "flex";
   
    document.getElementById("test-recommendation-result").innerHTML = ''; 
    document.querySelectorAll('#coffeeTestModal input[type="radio"]').forEach(radio => radio.checked = false);
}

function closeCoffeeTestModal() {
    document.getElementById("coffeeTestModal").style.display = "none";
}

function submitCoffeeTest() {
    const intensity = document.querySelector('input[name="intensity"]:checked')?.value;
    const flavor = document.querySelector('input[name="flavor"]:checked')?.value;
    const moment = document.querySelector('input[name="moment"]:checked')?.value;
    const method = document.querySelector('input[name="method"]:checked')?.value;
    const consumption = document.querySelector('input[name="consumption"]:checked')?.value;

    const resultadoDiv = document.getElementById('test-recommendation-result');

    if (!intensity || !flavor || !moment || !method || !consumption) {
        resultadoDiv.textContent = 'Por favor, responde todas las preguntas.';
        resultadoDiv.style.color = 'red';
        return;
    }

    let producto = null;
    let explicacion = "";

    if (intensity === 'fuerte' && flavor === 'chocolate' && method === 'espresso' && consumption !== 'azucar') {
        producto = products.find(p => p.id === 4); 
        explicacion = "Prefieres un café intenso, con cuerpo y notas profundas. <b>Bourbon Especialidad</b> es ideal para ti por su sabor a chocolate y caramelo.";
    } else if (intensity === 'media' && flavor === 'chocolate' && moment === 'manana' && consumption === 'leche') {
        producto = products.find(p => p.id === 1); 
        explicacion = "Buscas un café balanceado y reconfortante para tus mañanas con leche. <b>Café Molido Gourmet</b> es perfecto para acompañar ese momento.";
    } else if (intensity === 'suave' && (flavor === 'frutal' || flavor === 'floral') && method === 'filtrado') {
        producto = products.find(p => p.id === 3); 
        explicacion = "Te gustan los cafés suaves, florales y frutales. <b>Geisha Especialidad</b> te sorprenderá con su perfil aromático y elegante.";
    } else if (intensity === 'media' && flavor === 'frutal' && moment === 'manana' && consumption === 'solo') {
        producto = products.find(p => p.id === 2); 
        explicacion = "Disfrutas de un café aromático y equilibrado para empezar el día. <b>Café de Origen (Colombiano)</b> es una excelente elección.";
    } else if (intensity === 'media' && flavor === 'terroso' && method === 'prensa') {
        producto = products.find(p => p.id === 1); 
        explicacion = "Prefieres métodos de inmersión y sabores más profundos. <b>Café Molido Gourmet</b> es una opción versátil para prensa francesa.";
    } else if (consumption === 'leche') {
        producto = products.find(p => p.id === 1); 
        explicacion = "Si te gusta el café con leche, <b>Café Molido Gourmet</b> es una excelente opción para ti.";
    } else if (flavor === 'floral') {
        producto = products.find(p => p.id === 3); 
        explicacion = "Si buscas notas florales, <b>Geisha Especialidad</b> es tu mejor elección.";
    } else {
        producto = products.find(p => p.id === 2); 
        explicacion = "Basado en tus respuestas, te recomendamos <b>Café de Origen (Colombiano)</b>, un café versátil y de alta calidad.";
    }

    if (producto) {
        resultadoDiv.innerHTML = `
            <div class="producto" style="margin:0 auto;max-width:320px;">
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <strong>Precio: $${producto.precioBase.toFixed(2)}</strong>
                <p style="color:#4e342e;">${explicacion}</p>
                <button onclick="abrirModalCompra(${producto.id})" style="margin-top:10px;">Comprar este café</button>
            </div>
        `;
    } else {
        resultadoDiv.innerHTML = `
            <div style="padding:20px;">
                <h3>¡No se encontró un café ideal, pero explora nuestra tienda!</h3>
            </div>
        `;
    }
    resultadoDiv.style.color = '#4e342e';
}

function updateAuthUI() {
    const userInfoDiv = document.getElementById('userInfo');
    const authButtonsDiv = document.getElementById('authButtons');
    const currentUserNameSpan = document.getElementById('currentUserName');
    const adminPanelBtn = document.getElementById('adminPanelBtn');

    if (currentUser) {
        userInfoDiv.style.display = 'flex';
        authButtonsDiv.style.display = 'none';
        currentUserNameSpan.textContent = currentUser.username;
        adminPanelBtn.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
    } else {
        userInfoDiv.style.display = 'none';
        authButtonsDiv.style.display = 'flex';
        currentUserNameSpan.textContent = '';
        adminPanelBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarProductos();
    updateAuthUI();
});