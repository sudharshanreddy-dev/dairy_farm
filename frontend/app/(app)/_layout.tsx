import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useTheme } from '../../src/context/ThemeContext';
import { AuthContext } from '../../src/context/AuthContext';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const { user, logout } = React.useContext(AuthContext);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Drawer Header */}
        <View style={[styles.drawerHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.greenDim }]}>
             <MaterialCommunityIcons name="account" size={40} color={colors.green} />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Farmer'}</Text>
          <Text style={[styles.farmName, { color: colors.muted }]}>{user?.farmName || 'Dairy Farm'}</Text>
        </View>

        <View style={{ paddingVertical: 10 }}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Drawer Footer */}
      <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.redDim }]} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Logout Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        drawerActiveTintColor: colors.green,
        drawerInactiveTintColor: colors.muted,
        drawerStyle: {
          width: 280,
          backgroundColor: colors.bg,
        },
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen name="index" options={{
        title: 'Dashboard',
        headerShown: false,
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />,
      }} />
      <Drawer.Screen name="cattle" options={{
        title: 'My Herd',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="cow" size={22} color={color} />,
      }} />
      <Drawer.Screen name="analytics" options={{
        title: 'Analytics',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="chart-areaspline" size={22} color={color} />,
      }} />
      <Drawer.Screen name="scan" options={{
        title: 'QR Scanner',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="qrcode-scan" size={22} color={color} />,
      }} />
      <Drawer.Screen name="records" options={{
        title: 'Event Logs',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text" size={22} color={color} />,
      }} />
      <Drawer.Screen name="community" options={{
        title: 'Community',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={22} color={color} />,
      }} />
      <Drawer.Screen name="profile" options={{
        title: 'My Profile',
        drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-cog" size={22} color={color} />,
      }} />
      
      {/* Hide dynamic and utility routes from drawer and hide automatic headers */}
      <Drawer.Screen name="cattle/[id]" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="cattle/add" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="community/[id]" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="inventory" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  farmName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
