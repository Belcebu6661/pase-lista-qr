import React, { useState } from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';


function LoginScreen() {
    const [correo, setCorreo] = useState('');
    const [contrasena, setPassword] = useState('');

const iniciarSesion= ()=> {

}; return (

    <View style={styles.container}> 
    <Text style={styles.title}>Iniciar Sesión</Text>
    </View>

);
}
export default LoginScreen;