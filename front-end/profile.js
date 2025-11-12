document.addEventListener('DOMContentLoaded', async () => {

    const profilePic = document.getElementById('profilePic');
    const uploadImg = document.getElementById('upload-img');
    const usernameText = document.getElementById('usernameText');
    const actionBtn = document.getElementById('actionBtn');
    const editIcon = document.getElementById('editIcon');
    const saveIcon = document.getElementById('saveIcon');
    const addPhotoText = document.getElementById('addPhotoText');
    const changePhotoText = document.getElementById('changePhotoText');
    const photoDropdown = document.getElementById('photoDropdown');
    const removePicBtn = document.getElementById('removePicBtn');
    const uploadNewPicBtn = document.getElementById('uploadNewPicBtn');
    const defaultProfileSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='black' d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

    let isEditing = false;
    let originalName = usernameText.textContent


    const token = localStorage.getItem('token')

    if (!token) {
    window.location.href = './index.html'
    return;
    }

    try {
        
        const userRes = await fetch('http://localhost:3000/api/user/profile', {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })

        const userData = await userRes.json()
        
        //* check if token is still valid
        const payload = JSON.parse(atob(token.split(".")[1]));    
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
            localStorage.removeItem("token"); 
            window.location.href = "index.html"; 
            return;
        }


        //!check if data received 
        if (!userRes.ok) {
            throw new Error(userData.message || "Failed to load user")
        } 

        //*get all information from db
        // upload your picture from db
        const baseUrl = window.location.origin;
        profilePic.src = `${baseUrl}${userData.data.avatar}`;

        // print your name
        usernameText.textContent = userData.data.username
        
        
        //* update the picture when there is new photo
        function updatePhotoUI(hasCustomPic) {
            if (hasCustomPic) {
                addPhotoText.style.display = 'none';
                changePhotoText.style.display = 'flex';
                addPhotoText.classList.add('has-pic'); 
            } else {
                addPhotoText.style.display = 'flex';
                changePhotoText.style.display = 'none';
                addPhotoText.classList.remove('has-pic'); 
            }
        };  

        if (userData.data.avatar !== 'uploads/profile.png') {
            updatePhotoUI(true)
        }else {
            profilePic.src = defaultProfileSVG
            updatePhotoUI(false)
        }
        
    }catch (err) {
        console.error(err.message);
    }
    
        // --- وظائف إدارة الصورة ---
        
    

    //* change picture and if there isn't picture stop this function
    uploadImg.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    //* to appear picture and convert photo/pdf for (data)
    const reader = new FileReader();
    reader.onload = (ev) => {
        profilePic.src = ev.target.result;
        updatePhotoUI(true);
    };
    reader.readAsDataURL(file);

    //* send files to the server with http request
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await fetch('http://localhost:3000/api/user/upload', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`, // مهمة جدًا
        },
        body: formData, // هنا بنبعت الصورة
        });

        const data = await res.json();
        console.log('Server response:', data);

        if (data.success) {
        //* update picture from db 
        profilePic.src = `${window.location.origin}${data.imagePath}`;
        
        } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error uploading image:', err);
    }
    });

    // إظهار/إخفاء القائمة المنسدلة عند الضغط على "Change Profile Photo"
    changePhotoText.addEventListener('click', (e) => {
        e.stopPropagation(); 
        // إغلاق القائمة إن كانت مفتوحة، وفتحها إن كانت مغلقة
        photoDropdown.style.display = photoDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // إغلاق القائمة عند الضغط في أي مكان خارجها
    document.addEventListener('click', () => {
        photoDropdown.style.display = 'none';
    });

    // وظيفة إزالة الصورة
    removePicBtn.addEventListener('click', async () => {
        // profilePic.src = defaultProfileSVG;

        try {
            const res = await fetch('http://localhost:3000/api/user/delete-photo', {
                method:'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await res.json()
            console.log('Server response:', data);
            
            if (data.success) {
                
                profilePic.src = defaultProfileSVG
                updatePhotoUI(false); 
                photoDropdown.style.display = 'none';
                uploadImg.value = ''; 
            }else {
                alert('delete failed');
            }

        }catch (err) {
            console.log(err)
        }
    }); 

    // "Upload new picture"
    uploadNewPicBtn.addEventListener('click', () => {
        uploadImg.click(); 
        photoDropdown.style.display = 'none';
    });

    
    // --- وظائف إدارة الاسم (مأخوذة من الكود السابق وهي تعمل بشكل سليم) ---

    const handleBlur = () => {
            if (isEditing) {
            saveName();
        }
    };

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveName();
        }
    };

    const saveName = async () => {
        const input = document.getElementById('usernameInput');
        if (!input) return;

        try {
            const res = await fetch('http://localhost:3000/api/user/update-username', {
                method:'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body:JSON.stringify({username: input.value.trim()})
            }) 

            const data = await res.json()
            console.log(data);
            
            if(data.success) {

                input.removeEventListener('blur', handleBlur);
                input.removeEventListener('keydown', handleEnter);
                const newName = input.value.trim() || originalName;
                usernameText.textContent = newName;
                originalName = newName; 
                    
                input.replaceWith(usernameText);
                localStorage.setItem('username', originalName)
                
                saveIcon.style.display = 'none';
                editIcon.style.display = 'block';
                isEditing = false;
            }
                
        }catch(err) {
            console.error('error updating username',err)
        }
    };


    const startEdit = () => {
        if (isEditing) return;
        
        isEditing = true;
        originalName = usernameText.textContent;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.maxLength = 25;
        input.id = 'usernameInput';
        
        usernameText.replaceWith(input);
        input.focus();

        editIcon.style.display = 'none';
        saveIcon.style.display = 'block';

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleEnter);
    };

    actionBtn.addEventListener('click', () => {
        if (!isEditing) {
            startEdit();
        } else {
            saveName();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        updatePhotoUI(false); 
    });

})

