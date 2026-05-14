import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, 
  ScrollView, TouchableWithoutFeedback, Dimensions, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

export interface FilterSection {
  title: string;
  key: string;
  type: 'select' | 'toggle' | 'date'; // 'date' simplified for now as text or placeholder
  options?: { label: string; value: any }[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  sections: FilterSection[];
  filters: any;
  onApply: (newFilters: any) => void;
  onClear: () => void;
  title?: string;
}

export default function FilterModal({
  visible, onClose, sections, filters, onApply, onClear, title = 'Filter & Sort'
}: FilterModalProps) {
  const { colors, isDark } = useTheme();
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    if (visible) setLocalFilters(filters);
  }, [visible, filters]);

  const toggleOption = (key: string, value: any) => {
    if (localFilters[key] === value) {
      const next = { ...localFilters };
      delete next[key];
      setLocalFilters(next);
    } else {
      setLocalFilters({ ...localFilters, [key]: value });
    }
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Header */}
              <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Text style={[s.title, { color: colors.text }]}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
                {sections.map((section) => (
                  <View key={section.key} style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.muted }]}>{section.title}</Text>
                    <View style={s.optionsGrid}>
                      {section.options?.map((opt) => {
                        const isActive = localFilters[section.key] === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              s.option,
                              { backgroundColor: colors.surface2, borderColor: colors.border },
                              isActive && { backgroundColor: colors.greenDim, borderColor: colors.green }
                            ]}
                            onPress={() => toggleOption(section.key, opt.value)}
                          >
                            <Text style={[
                              s.optionText,
                              { color: colors.text },
                              isActive && { color: colors.green, fontWeight: '800' }
                            ]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Footer */}
              <View style={[s.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity 
                  style={[s.clearBtn, { borderColor: colors.border }]} 
                  onPress={() => {
                    onClear();
                    onClose();
                  }}
                >
                  <Text style={[s.clearBtnText, { color: colors.muted }]}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.applyBtn, { backgroundColor: colors.green }]} 
                  onPress={handleApply}
                >
                  <Text style={s.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.8,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  clearBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
