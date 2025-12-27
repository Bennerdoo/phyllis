import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { UserProfile } from '@/lib/types';

// Register a nice font if possible, or use standard
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    section: { margin: 10, padding: 10 },
    header: { marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 },
    name: { fontSize: 24, fontWeight: 'bold' },
    contact: { fontSize: 10, color: 'gray', marginTop: 5 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderBottom: '1px solid #eee' },
    text: { fontSize: 11, lineHeight: 1.5 },
    bold: { fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
});

export const ResumePDF = ({ profile }: { profile: UserProfile }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.contact}>
                    {profile.email} | {profile.phone} | {profile.location}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {profile.links.map(link => (
                        <Text key={link.url} style={styles.contact}>{link.label}: {link.url}</Text>
                    ))}
                </View>
            </View>

            {/* Summary */}
            {profile.summary && (
                <View>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.text}>{profile.summary}</Text>
                </View>
            )}

            {/* Experience */}
            <View>
                <Text style={styles.sectionTitle}>Experience</Text>
                {profile.experience.map((exp, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                        <View style={styles.row}>
                            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{exp.company}</Text>
                            <Text style={styles.text}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <Text style={{ ...styles.text, fontStyle: 'italic' }}>{exp.role}</Text>
                        <Text style={styles.text}>{exp.description}</Text>
                    </View>
                ))}
            </View>

            {/* Skills */}
            <View>
                <Text style={styles.sectionTitle}>Skills</Text>
                <Text style={styles.text}>{profile.skills.join(', ')}</Text>
            </View>

            {/* Education */}
            <View>
                <Text style={styles.sectionTitle}>Education</Text>
                {profile.education.map((edu, i) => (
                    <View key={i} style={styles.row}>
                        <Text style={styles.text}>{edu.school} - {edu.degree}</Text>
                        <Text style={styles.text}>{edu.year}</Text>
                    </View>
                ))}
            </View>

        </Page>
    </Document>
);
